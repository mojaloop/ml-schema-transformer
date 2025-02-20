/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>
 
 * Steven Oderayi <steven.oderayi@infitx.com>
 --------------
 ******/

// FSPIOP ISO220022 to FSPIOP mappings

export const transfers = {
  post: `{
    "$noDefaults": "true",
    "body.expiration": "body.GrpHdr.PmtInstrXpryDtTm",
    "body.transferId": "body.CdtTrfTxInf.PmtId.TxId",
    "body.payeeFsp": "body.CdtTrfTxInf.CdtrAgt.FinInstnId.Othr.Id",
    "body.payerFsp": "body.CdtTrfTxInf.DbtrAgt.FinInstnId.Othr.Id",
    "body.amount.currency": "body.CdtTrfTxInf.IntrBkSttlmAmt.Ccy",
    "body.amount.amount": "body.CdtTrfTxInf.IntrBkSttlmAmt.ActiveCurrencyAndAmount",
    "body.ilpPacket": "body.CdtTrfTxInf.VrfctnOfTerms.IlpV4PrepPacket",
    "body.condition": ["body.CdtTrfTxInf.VrfctnOfTerms.IlpV4PrepPacket", { "$transform": "ilpPacketToCondition" }]
  }`,
  patch: `{
    "$noDefaults": "true",
    "body.completedTimestamp": "body.TxInfAndSts.PrcgDt.DtTm",
    "body.transferState": ["body.TxInfAndSts.TxSts", { "$transform": "toFspiopTransferState" }]
  }`,
  put: `{
    "$noDefaults": "true",
    "body.fulfilment": "body.TxInfAndSts.ExctnConf",
    "body.completedTimestamp": "body.TxInfAndSts.PrcgDt.DtTm",
    "body.transferState": ["body.TxInfAndSts.TxSts", { "$transform": "toFspiopTransferState" }]
  }`,
  putError: `{
    "$noDefaults": "true",
    "body.errorInformation.errorCode": "body.TxInfAndSts.StsRsnInf.Rsn.Cd",
    "body.errorInformation.errorDescription": ["body.TxInfAndSts.StsRsnInf.Rsn.Cd", { "$transform": "fspiopErrorDescrForCode" }]
  }`
}

// FSPIOP to FSPIOP ISO20022 mappings

export const transfers_reverse = {
  postTesting: `{
    "$noDefaults": "true",
    "body.GrpHdr.MsgId": { "$transform": "generateID" },
    "body.GrpHdr.CreDtTm": { "$transform": "datetimeNow" },
    "body.GrpHdr.NbOfTxs": { "$transform": "fixed", "value": "1" },
    "body.GrpHdr.SttlmInf.SttlmMtd": { "$transform": "fixed", "value": "CLRG" },
    "body.GrpHdr.PmtInstrXpryDtTm": "body.expiration",
    "body.CdtTrfTxInf.PmtId.TxId": "body.transferId",
    "body.CdtTrfTxInf.ChrgBr": { "$alt": [ "$context.isoPostQuoteResponse.CdtTrfTxInf.ChrgBr", { "$transform": "fixed", "value": "SHAR" } ] },
    "body.CdtTrfTxInf.Cdtr.Id.OrgId.Othr.Id": "body.payeeFsp",
    "body.CdtTrfTxInf.Dbtr.Id.OrgId.Othr.Id": "body.payerFsp",
    "body.CdtTrfTxInf.CdtrAgt.FinInstnId.Othr.Id": "body.payeeFsp",
    "body.CdtTrfTxInf.DbtrAgt.FinInstnId.Othr.Id": "body.payerFsp",
    "body.CdtTrfTxInf.IntrBkSttlmAmt.Ccy": "body.amount.currency",
    "body.CdtTrfTxInf.IntrBkSttlmAmt.ActiveCurrencyAndAmount": "body.amount.amount",
    "body.CdtTrfTxInf.VrfctnOfTerms.IlpV4PrepPacket": "body.ilpPacket"
  }`,
  post: `{
      "$noDefaults": "true",
      "body.GrpHdr.MsgId": { "$transform": "generateID" },
      "body.GrpHdr.CreDtTm": { "$transform": "datetimeNow" },
      "body.GrpHdr.NbOfTxs": { "$transform": "fixed", "value": "1" },
      "body.GrpHdr.SttlmInf.SttlmMtd": { "$transform": "fixed", "value": "CLRG" },
      "body.GrpHdr.PmtInstrXpryDtTm": "body.expiration",
      "body.CdtTrfTxInf.PmtId.TxId": "body.transferId",
      "body.CdtTrfTxInf.ChrgBr": "$context.isoPostQuoteResponse.CdtTrfTxInf.ChrgBr",
      "body.CdtTrfTxInf.Cdtr": "$context.isoPostQuoteResponse.CdtTrfTxInf.Cdtr",
      "body.CdtTrfTxInf.Dbtr": "$context.isoPostQuoteResponse.CdtTrfTxInf.Dbtr",
      "body.CdtTrfTxInf.CdtrAgt.FinInstnId.Othr.Id": "body.payeeFsp",
      "body.CdtTrfTxInf.DbtrAgt.FinInstnId.Othr.Id": "body.payerFsp",
      "body.CdtTrfTxInf.IntrBkSttlmAmt.Ccy": "body.amount.currency",
      "body.CdtTrfTxInf.IntrBkSttlmAmt.ActiveCurrencyAndAmount": "body.amount.amount",
      "body.CdtTrfTxInf.VrfctnOfTerms.IlpV4PrepPacket": "body.ilpPacket"
  }`,
  patch: `{
    "$noDefaults": "true",
    "body.GrpHdr.MsgId": { "$transform": "generateID" },
    "body.GrpHdr.CreDtTm": { "$transform": "datetimeNow" },
    "body.TxInfAndSts.PrcgDt.DtTm": "body.completedTimestamp",
    "body.TxInfAndSts.TxSts": ["body.transferState", { "$transform": "toIsoTransferState" }]
  }`,
  put: `{
    "$noDefaults": "true",
    "body.GrpHdr.MsgId": { "$transform": "generateID" },
    "body.GrpHdr.CreDtTm": { "$transform": "datetimeNow" },
    "body.TxInfAndSts.ExctnConf": "body.fulfilment",
    "body.TxInfAndSts.PrcgDt.DtTm": "body.completedTimestamp",
    "body.TxInfAndSts.TxSts": ["body.transferState", { "$transform": "toIsoTransferState" }]
  }`,
  putError: `{
    "$noDefaults": "true",
    "body.GrpHdr.MsgId": { "$transform": "generateID" },
    "body.GrpHdr.CreDtTm": { "$transform": "datetimeNow" },
    "body.TxInfAndSts.StsRsnInf.Rsn.Cd": "body.errorInformation.errorCode"
  }`
}
