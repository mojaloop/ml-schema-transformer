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

// FSPIOP ISO20022 to FSPIOP mappings

export const fxQuotes = {
  post: `{
    "$noDefaults": "true",
    "body.conversionTerms.expiration": "body.GrpHdr.PmtInstrXpryDtTm",
    "body.conversionRequestId": "body.CdtTrfTxInf.PmtId.TxId",
    "body.conversionTerms.conversionId": "body.CdtTrfTxInf.PmtId.InstrId",
    "body.conversionTerms.determiningTransferId": "body.CdtTrfTxInf.PmtId.EndToEndId",
    "body.conversionTerms.initiatingFsp": "body.CdtTrfTxInf.Dbtr.FinInstnId.Othr.Id",
    "body.conversionTerms.counterPartyFsp": "body.CdtTrfTxInf.Cdtr.FinInstnId.Othr.Id",
    "body.conversionTerms.sourceAmount.currency": "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.InstdAmt.Ccy",
    "body.conversionTerms.sourceAmount.amount": "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.InstdAmt.ActiveOrHistoricCurrencyAndAmount",
    "body.conversionTerms.targetAmount.currency": "body.CdtTrfTxInf.IntrBkSttlmAmt.Ccy",
    "body.conversionTerms.targetAmount.amount": "body.CdtTrfTxInf.IntrBkSttlmAmt.ActiveCurrencyAndAmount",
    "body.conversionTerms.amountType": "body.CdtTrfTxInf.InstrForCdtrAgt.InstrInf"
  }`,
  put: `{
    "$noDefaults": "true",
    "body.condition": "body.CdtTrfTxInf.VrfctnOfTerms.Sh256Sgntr", 
    "body.conversionTerms.conversionId": "body.CdtTrfTxInf.PmtId.InstrId",
    "body.conversionTerms.determiningTransferId": "body.CdtTrfTxInf.PmtId.TxId",
    "body.conversionTerms.initiatingFsp": "body.CdtTrfTxInf.Dbtr.FinInstnId.Othr.Id",
    "body.conversionTerms.counterPartyFsp": "body.CdtTrfTxInf.Cdtr.FinInstnId.Othr.Id",
    "body.conversionTerms.sourceAmount.currency": "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.InstdAmt.Ccy",
    "body.conversionTerms.sourceAmount.amount": "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.InstdAmt.ActiveOrHistoricCurrencyAndAmount",
    "body.conversionTerms.targetAmount.currency": "body.CdtTrfTxInf.IntrBkSttlmAmt.Ccy",
    "body.conversionTerms.targetAmount.amount": "body.CdtTrfTxInf.IntrBkSttlmAmt.ActiveCurrencyAndAmount",
    "body.conversionTerms.expiration": "body.GrpHdr.PmtInstrXpryDtTm",
    "body.conversionTerms.amountType": "body.CdtTrfTxInf.InstrForCdtrAgt.InstrInf"
  }`,
  putError: `{
    "$noDefaults": "true",
    "body.errorInformation.errorCode": "body.TxInfAndSts.StsRsnInf.Rsn.Cd",
    "body.errorInformation.errorDescription": ["body.TxInfAndSts.StsRsnInf.Rsn.Cd", { "$transform": "fspiopErrorDescrForCode" }]
  }`
}

// FSPIOP to FSPIOP ISO20022 mappings

export const fxQuotes_reverse = {
  post: `{
    "$noDefaults": "true",
    "body.GrpHdr.MsgId": { "$transform": "generateID" },
    "body.GrpHdr.CreDtTm": { "$transform": "datetimeNow" },
    "body.GrpHdr.NbOfTxs": { "$transform": "fixed", "value": "1" },
    "body.GrpHdr.SttlmInf.SttlmMtd": { "$transform": "fixed", "value": "CLRG" },
    "body.GrpHdr.PmtInstrXpryDtTm": "body.conversionTerms.expiration",
    "body.CdtTrfTxInf.PmtId.TxId": "body.conversionRequestId",
    "body.CdtTrfTxInf.PmtId.InstrId": "body.conversionTerms.conversionId",
    "body.CdtTrfTxInf.PmtId.EndToEndId": "body.conversionTerms.determiningTransferId",
    "body.CdtTrfTxInf.Dbtr.FinInstnId.Othr.Id": "body.conversionTerms.initiatingFsp",
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.Dbtr.Id.OrgId.Othr.Id": "body.conversionTerms.initiatingFsp",
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.DbtrAgt.FinInstnId.Othr.Id": "body.conversionTerms.initiatingFsp",
    "body.CdtTrfTxInf.Cdtr.FinInstnId.Othr.Id": "body.conversionTerms.counterPartyFsp",  
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.Cdtr.Id.OrgId.Othr.Id": "body.conversionTerms.counterPartyFsp",
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.CdtrAgt.FinInstnId.Othr.Id": "body.conversionTerms.counterPartyFsp",
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.InstdAmt.Ccy": "body.conversionTerms.sourceAmount.currency",
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.InstdAmt.ActiveOrHistoricCurrencyAndAmount": { "$alt": [ "body.conversionTerms.sourceAmount.amount", { "$transform": "fixed", "value": "0" } ] },
    "body.CdtTrfTxInf.IntrBkSttlmAmt.Ccy": "body.conversionTerms.targetAmount.currency",
    "body.CdtTrfTxInf.IntrBkSttlmAmt.ActiveCurrencyAndAmount": { "$alt": [ "body.conversionTerms.targetAmount.amount", { "$transform": "fixed", "value": "0" } ] },
    "body.CdtTrfTxInf.InstrForCdtrAgt.InstrInf": "body.conversionTerms.amountType"
  }`,
  put: `{
    "$noDefaults": "true",
    "body.GrpHdr.MsgId": { "$transform": "generateID" },
    "body.GrpHdr.CreDtTm": { "$transform": "datetimeNow" },
    "body.GrpHdr.NbOfTxs": { "$transform": "fixed", "value": "1" },
    "body.GrpHdr.SttlmInf.SttlmMtd": { "$transform": "fixed", "value": "CLRG" },
    "body.GrpHdr.PmtInstrXpryDtTm": "body.conversionTerms.expiration",
    "body.CdtTrfTxInf.VrfctnOfTerms.Sh256Sgntr": "body.condition",
    "body.CdtTrfTxInf.PmtId.InstrId": "body.conversionTerms.conversionId",
    "body.CdtTrfTxInf.PmtId.TxId": "body.conversionTerms.determiningTransferId",
    "body.CdtTrfTxInf.Dbtr.FinInstnId.Othr.Id": "body.conversionTerms.initiatingFsp",
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.Dbtr.Id.OrgId.Othr.Id": "body.conversionTerms.initiatingFsp",
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.DbtrAgt.FinInstnId.Othr.Id": "body.conversionTerms.initiatingFsp",
    "body.CdtTrfTxInf.Cdtr.FinInstnId.Othr.Id": "body.conversionTerms.counterPartyFsp",  
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.Cdtr.Id.OrgId.Othr.Id": "body.conversionTerms.counterPartyFsp",
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.CdtrAgt.FinInstnId.Othr.Id": "body.conversionTerms.counterPartyFsp",
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.InstdAmt.Ccy": "body.conversionTerms.sourceAmount.currency",
    "body.CdtTrfTxInf.UndrlygCstmrCdtTrf.InstdAmt.ActiveOrHistoricCurrencyAndAmount": "body.conversionTerms.sourceAmount.amount",
    "body.CdtTrfTxInf.IntrBkSttlmAmt.Ccy": "body.conversionTerms.targetAmount.currency",
    "body.CdtTrfTxInf.IntrBkSttlmAmt.ActiveCurrencyAndAmount": "body.conversionTerms.targetAmount.amount",
    "body.CdtTrfTxInf.InstrForCdtrAgt.InstrInf": "body.conversionTerms.amountType"
  }`,
  putError: `{
    "$noDefaults": "true",
    "body.GrpHdr.MsgId": { "$transform": "generateID" },
    "body.GrpHdr.CreDtTm": { "$transform": "datetimeNow" },
    "body.TxInfAndSts.StsRsnInf.Rsn.Cd": "body.errorInformation.errorCode"
  }`
}
