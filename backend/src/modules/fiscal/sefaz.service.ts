import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as forge from 'node-forge';
import * as soap from 'soap';
import * as crypto from 'crypto';
import { create } from 'xmlbuilder2';

interface SefazConfig {
  certificate: string; // Certificado A1 em base64
  password: string;
  environment: 'homologacao' | 'producao';
  uf: string;
}

interface SefazResponse {
  success: boolean;
  status: string;
  protocol?: string;
  xml?: string;
  message?: string;
  error?: string;
}

@Injectable()
export class SefazService {
  private readonly logger = new Logger(SefazService.name);

  // URLs dos WebServices SEFAZ por UF
  private readonly webserviceUrlsByUF = {
    BA: {
      homologacao: {
        NFeAutorizacao: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx?wsdl',
        NFeRetAutorizacao: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx?wsdl',
        NFeStatusServico: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx?wsdl',
        NFeConsultaProtocolo: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx?wsdl',
        NFeInutilizacao: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeInutilizacao4/NFeInutilizacao4.asmx?wsdl',
      },
      producao: {
        NFeAutorizacao: 'https://nfe.sefaz.ba.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx?wsdl',
        NFeRetAutorizacao: 'https://nfe.sefaz.ba.gov.br/webservices/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx?wsdl',
        NFeStatusServico: 'https://nfe.sefaz.ba.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx?wsdl',
        NFeConsultaProtocolo: 'https://nfe.sefaz.ba.gov.br/webservices/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx?wsdl',
        NFeInutilizacao: 'https://nfe.sefaz.ba.gov.br/webservices/NFeInutilizacao4/NFeInutilizacao4.asmx?wsdl',
      },
    },
    SP: {
      homologacao: {
        NFeAutorizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx?wsdl',
        NFeRetAutorizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeRetAutorizacao4.asmx?wsdl',
        NFeStatusServico: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeStatusServico4.asmx?wsdl',
        NFeConsultaProtocolo: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeConsultaProtocolo4.asmx?wsdl',
        NFeInutilizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeInutilizacao4.asmx?wsdl',
      },
      producao: {
        NFeAutorizacao: 'https://nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx?wsdl',
        NFeRetAutorizacao: 'https://nfce.fazenda.sp.gov.br/ws/NFeRetAutorizacao4.asmx?wsdl',
        NFeStatusServico: 'https://nfce.fazenda.sp.gov.br/ws/NFeStatusServico4.asmx?wsdl',
        NFeConsultaProtocolo: 'https://nfce.fazenda.sp.gov.br/ws/NFeConsultaProtocolo4.asmx?wsdl',
        NFeInutilizacao: 'https://nfce.fazenda.sp.gov.br/ws/NFeInutilizacao4.asmx?wsdl',
      },
    },
  };

  private getWebserviceUrls(uf: string, environment: 'homologacao' | 'producao') {
    const urls = this.webserviceUrlsByUF[uf];
    if (!urls) {
      this.logger.warn(`UF ${uf} não configurada, usando SP como padrão`);
      return this.webserviceUrlsByUF.SP[environment];
    }
    return urls[environment];
  }

  /**
   * Assina digitalmente o XML da NFC-e
   */
  async signXml(xml: string, config: SefazConfig): Promise<string> {
    try {
      this.logger.log('Iniciando assinatura digital do XML');

      // Decodificar certificado do base64
      const certificateBuffer = Buffer.from(config.certificate, 'base64');
      
      // Carregar certificado PFX/P12
      const p12Asn1 = forge.asn1.fromDer(certificateBuffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, config.password);

      // Extrair chave privada e certificado
      const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = bags[forge.pki.oids.certBag][0];
      const certificate = certBag.cert;

      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
      const privateKey = keyBag.key;

      // Extrair a chave de acesso do XML para identificar o elemento a ser assinado
      const accessKeyMatch = xml.match(/Id="NFe(\d{44})"/);
      if (!accessKeyMatch) {
        throw new Error('Chave de acesso não encontrada no XML');
      }
      const accessKey = accessKeyMatch[1];

      // Criar digest (hash SHA-256) do elemento infNFe
      const infNFeMatch = xml.match(/<infNFe[^>]*>[\s\S]*?<\/infNFe>/);
      if (!infNFeMatch) {
        throw new Error('Elemento infNFe não encontrado');
      }
      const infNFeXml = infNFeMatch[0];
      
      const md = forge.md.sha256.create();
      md.update(infNFeXml, 'utf8');
      const digestValue = forge.util.encode64(md.digest().bytes());

      // Criar SignedInfo
      const signedInfo = create({ version: '1.0' })
        .ele('SignedInfo', { xmlns: 'http://www.w3.org/2000/09/xmldsig#' })
        .ele('CanonicalizationMethod', { Algorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315' }).up()
        .ele('SignatureMethod', { Algorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256' }).up()
        .ele('Reference', { URI: `#NFe${accessKey}` })
          .ele('Transforms')
            .ele('Transform', { Algorithm: 'http://www.w3.org/2000/09/xmldsig#enveloped-signature' }).up()
            .ele('Transform', { Algorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315' }).up()
          .up()
          .ele('DigestMethod', { Algorithm: 'http://www.w3.org/2001/04/xmlenc#sha256' }).up()
          .ele('DigestValue').txt(digestValue).up()
        .up()
        .end({ prettyPrint: false });

      // Assinar SignedInfo
      const signedInfoMd = forge.md.sha256.create();
      signedInfoMd.update(signedInfo, 'utf8');
      const signature = (privateKey as any).sign(signedInfoMd);
      const signatureValue = forge.util.encode64(signature);

      // Obter certificado em base64
      const certPem = forge.pki.certificateToPem(certificate);
      const certBase64 = certPem
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\n/g, '');

      // Construir elemento Signature
      const signatureElement = `
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    ${signedInfo}
    <SignatureValue>${signatureValue}</SignatureValue>
    <KeyInfo>
      <X509Data>
        <X509Certificate>${certBase64}</X509Certificate>
      </X509Data>
    </KeyInfo>
  </Signature>`;

      // Inserir assinatura no XML antes do fechamento de </infNFe>
      const signedXml = xml.replace('</infNFe>', signatureElement + '\n</infNFe>');

      this.logger.log('XML assinado com sucesso');
      return signedXml;
    } catch (error) {
      this.logger.error('Erro ao assinar XML', error);
      throw new BadRequestException(`Erro ao assinar XML: ${error.message}`);
    }
  }

  /**
   * Envia NF-e para autorização na SEFAZ
   */
  async authorizeNfe(xml: string, config: SefazConfig): Promise<SefazResponse> {
    try {
      this.logger.log('Enviando NF-e para autorização SEFAZ');

      // Assinar XML
      const signedXml = await this.signXml(xml, config);

      // Construir envelope de envio
      const lote = Math.floor(Math.random() * 999999999);
      const envelope = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('enviNFe', { 
          xmlns: 'http://www.portalfiscal.inf.br/nfe',
          versao: '4.00',
        })
        .ele('idLote').txt(lote.toString()).up()
        .ele('indSinc').txt('1').up() // Síncrono
        .ele('NFe', { xmlns: 'http://www.portalfiscal.inf.br/nfe' })
          .import(create(signedXml).first())
        .up()
        .end({ prettyPrint: true });

      // Selecionar ambiente
      const urls = this.getWebserviceUrls(config.uf, config.environment);

      // Criar cliente SOAP
      const https = require('https');
      const axios = require('axios');
      
      const client = await soap.createClientAsync(urls.NFeAutorizacao, {
        endpoint: urls.NFeAutorizacao.replace('?wsdl', ''),
        request: axios.create({
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        })
      });

      // Enviar para SEFAZ
      const [result] = await client.nfeAutorizacaoLoteAsync({
        nfeDadosMsg: envelope,
      });

      // Processar resposta
      const retorno = result.nfeResultMsg;
      
      this.logger.log('Resposta SEFAZ recebida');

      // Parse XML de resposta
      const status = this.extractStatusFromXml(retorno);
      
      if (status.codigo === '100') {
        // Autorizada
        return {
          success: true,
          status: 'AUTORIZADA',
          protocol: status.protocol,
          xml: signedXml,
          message: status.message,
        };
      } else if (status.codigo === '103' || status.codigo === '105') {
        // Lote em processamento - consultar retorno
        return await this.queryAuthorization(status.recibo, config);
      } else {
        // Rejeição ou erro
        return {
          success: false,
          status: 'REJEITADA',
          message: status.message,
          error: `Código: ${status.codigo}`,
        };
      }
    } catch (error) {
      this.logger.error('Erro ao autorizar NF-e na SEFAZ', error);
      return {
        success: false,
        status: 'ERRO',
        message: 'Erro ao comunicar com SEFAZ',
        error: error.message,
      };
    }
  }

  /**
   * Envia NFC-e para autorização na SEFAZ
   */
  async authorizeNfce(xml: string, config: SefazConfig): Promise<SefazResponse> {
    try {
      this.logger.log('Enviando NFC-e para autorização SEFAZ');

      // Assinar XML
      const signedXml = await this.signXml(xml, config);

      // Construir envelope de envio
      const lote = Math.floor(Math.random() * 999999999);
      const envelope = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('enviNFe', { 
          xmlns: 'http://www.portalfiscal.inf.br/nfe',
          versao: '4.00',
        })
        .ele('idLote').txt(lote.toString()).up()
        .ele('indSinc').txt('1').up() // Síncrono
        .ele('NFe', { xmlns: 'http://www.portalfiscal.inf.br/nfe' })
          .import(create(signedXml).first())
        .up()
        .end({ prettyPrint: true });

      // Selecionar ambiente
      const urls = this.getWebserviceUrls(config.uf, config.environment);

      // Criar cliente SOAP
      const https = require('https');
      const axios = require('axios');
      
      const client = await soap.createClientAsync(urls.NFeAutorizacao, {
        endpoint: urls.NFeAutorizacao.replace('?wsdl', ''),
        request: axios.create({
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        })
      });

      // Enviar para SEFAZ
      const [result] = await client.nfeAutorizacaoLoteAsync({
        nfeDadosMsg: envelope,
      });

      // Processar resposta
      const retorno = result.nfeResultMsg;
      
      this.logger.log('Resposta SEFAZ recebida');

      // Parse XML de resposta
      const status = this.extractStatusFromXml(retorno);
      
      if (status.codigo === '100') {
        // Autorizada
        return {
          success: true,
          status: 'AUTORIZADA',
          protocol: status.protocol,
          xml: signedXml,
          message: status.message,
        };
      } else if (status.codigo === '103' || status.codigo === '105') {
        // Lote em processamento - consultar retorno
        return await this.queryAuthorization(status.recibo, config);
      } else {
        // Rejeição ou erro
        return {
          success: false,
          status: 'REJEITADA',
          message: status.message,
          error: `Código: ${status.codigo}`,
        };
      }
    } catch (error) {
      this.logger.error('Erro ao autorizar NFC-e na SEFAZ', error);
      return {
        success: false,
        status: 'ERRO',
        message: 'Erro ao comunicar com SEFAZ',
        error: error.message,
      };
    }
  }

  /**
   * Consulta o retorno da autorização
   */
  private async queryAuthorization(recibo: string, config: SefazConfig): Promise<SefazResponse> {
    try {
      this.logger.log(`Consultando retorno da autorização. Recibo: ${recibo}`);

      const urls = this.getWebserviceUrls(config.uf, config.environment);

      // Construir consulta
      const consulta = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('consReciNFe', {
          xmlns: 'http://www.portalfiscal.inf.br/nfe',
          versao: '4.00',
        })
        .ele('tpAmb').txt(config.environment === 'producao' ? '1' : '2').up()
        .ele('nRec').txt(recibo).up()
        .end({ prettyPrint: true });

      // Criar cliente SOAP
      const https = require('https');
      const axios = require('axios');
      
      const client = await soap.createClientAsync(urls.NFeRetAutorizacao, {
        request: axios.create({
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        })
      });

      // Aguardar processamento (tentar até 5 vezes com intervalo de 2 segundos)
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const [result] = await client.nfeRetAutorizacaoAsync({
          nfeDadosMsg: consulta,
        });

        const status = this.extractStatusFromXml(result.nfeResultMsg);

        if (status.codigo === '100') {
          return {
            success: true,
            status: 'AUTORIZADA',
            protocol: status.protocol,
            message: status.message,
          };
        } else if (status.codigo !== '105') {
          // Não está mais em processamento
          return {
            success: false,
            status: 'REJEITADA',
            message: status.message,
            error: `Código: ${status.codigo}`,
          };
        }
      }

      return {
        success: false,
        status: 'TIMEOUT',
        message: 'Timeout ao aguardar processamento',
      };
    } catch (error) {
      this.logger.error('Erro ao consultar retorno', error);
      throw error;
    }
  }

  /**
   * Consulta status do serviço SEFAZ
   */
  async checkServiceStatus(config: SefazConfig): Promise<{ online: boolean; message: string }> {
    try {
      this.logger.log('Consultando status do serviço SEFAZ');

      const urls = this.getWebserviceUrls(config.uf, config.environment);

      const ufCodes = { BA: '29', SP: '35' };
      const cUF = ufCodes[config.uf] || '35';

      const consulta = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('consStatServ', {
          xmlns: 'http://www.portalfiscal.inf.br/nfe',
          versao: '4.00',
        })
        .ele('tpAmb').txt(config.environment === 'producao' ? '1' : '2').up()
        .ele('cUF').txt(cUF).up()
        .ele('xServ').txt('STATUS').up()
        .end({ prettyPrint: true });

      const https = require('https');
      const axios = require('axios');
      
      const client = await soap.createClientAsync(urls.NFeStatusServico, {
        request: axios.create({
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          })
        })
      });

      const [result] = await client.nfeStatusServicoNFAsync({
        nfeDadosMsg: consulta,
      });

      const status = this.extractStatusFromXml(result.nfeResultMsg);

      return {
        online: status.codigo === '107',
        message: status.message || 'Serviço operando normalmente',
      };
    } catch (error) {
      this.logger.error('Erro ao consultar status SEFAZ', error);
      return {
        online: false,
        message: `Erro: ${error.message}`,
      };
    }
  }

  /**
   * Extrai informações de status do XML de resposta
   */
  private extractStatusFromXml(xml: string): any {
    try {
      const codigoMatch = xml.match(/<cStat>(\d+)<\/cStat>/);
      const mensagemMatch = xml.match(/<xMotivo>(.*?)<\/xMotivo>/);
      const protocoloMatch = xml.match(/<nProt>(\d+)<\/nProt>/);
      const reciboMatch = xml.match(/<nRec>(\d+)<\/nRec>/);

      return {
        codigo: codigoMatch ? codigoMatch[1] : null,
        message: mensagemMatch ? mensagemMatch[1] : null,
        protocol: protocoloMatch ? protocoloMatch[1] : null,
        recibo: reciboMatch ? reciboMatch[1] : null,
      };
    } catch (error) {
      this.logger.error('Erro ao extrair status do XML', error);
      return { codigo: null, message: 'Erro ao processar resposta' };
    }
  }

  /**
   * Valida certificado digital
   */
  validateCertificate(certificate: string, password: string): { valid: boolean; expiresAt?: Date; cnpj?: string; error?: string } {
    try {
      const certificateBuffer = Buffer.from(certificate, 'base64');
      const p12Asn1 = forge.asn1.fromDer(certificateBuffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = bags[forge.pki.oids.certBag][0];
      const cert = certBag.cert;

      // Verificar validade
      const now = new Date();
      const notBefore = cert.validity.notBefore;
      const notAfter = cert.validity.notAfter;

      if (now < notBefore || now > notAfter) {
        return {
          valid: false,
          error: 'Certificado expirado ou ainda não válido',
        };
      }

      // Extrair CNPJ do certificado
      const subject = cert.subject.attributes;
      const cnpjAttr = subject.find((attr: any) => attr.shortName === 'CN');
      const cnpj = cnpjAttr ? this.extractCnpjFromCN(cnpjAttr.value) : null;

      return {
        valid: true,
        expiresAt: notAfter,
        cnpj,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Erro ao validar certificado: ${error.message}`,
      };
    }
  }

  /**
   * Extrai CNPJ do CN do certificado
   */
  private extractCnpjFromCN(cn: string): string | null {
    const match = cn.match(/(\d{14})/);
    return match ? match[1] : null;
  }
}
