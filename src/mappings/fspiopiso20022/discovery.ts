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

export const discovery = {
  parties: {
    put: `{
      "$noDefaults": true,
      "headers.fspiop-source": "body.Assgnmt.Assgnr.Agt.FinInstnId.Othr.Id",
      "headers.fspiop-destination": "body.Assgnmt.Assgne.Agt.FinInstnId.Othr.Id",
      "params.IdPath": "body.Rpt.OrgnlId",
      "body.party.partyIdInfo.partyIdType": { "$alt": [ "body.Rpt.UpdtdPtyAndAcctId.Pty.Id.OrgId.Othr.SchmeNm.Prtry", "body.Rpt.UpdtdPtyAndAcctId.Pty.Id.PrvtId.Othr.SchmeNm.Prtry", "body.Rpt.UpdtdPtyAndAcctId.Pty.PrvtId.Othr.Id" ] },
      "body.party.partyIdInfo.partyIdentifier": { "$alt": ["body.Rpt.UpdtdPtyAndAcctId.Pty.Id.OrgId.Othr.Id", "body.Rpt.UpdtdPtyAndAcctId.Pty.Id.PrvtId.Othr.Id"] },
      "body.party.partyIdInfo.fspId": "body.Rpt.UpdtdPtyAndAcctId.Agt.FinInstnId.Othr.Id",
      "body.party.name": "body.Rpt.UpdtdPtyAndAcctId.Pty.Nm",
      "body.party.supportedCurrencies": ["body.Rpt.UpdtdPtyAndAcctId.Acct.Ccy", { "$transform": "toArray" }]
    }`,
    putError: `{
      "$noDefaults": true,
      "body.errorInformation.errorDescription": ["body.Rpt.Rsn.Cd", { "$transform": "fspiopErrorDescrForCode" }],
      "body.errorInformation.errorCode": "body.Rpt.Rsn.Cd",
      "headers.fspiop-source": "body.Assgnmt.Assgnr.Agt.FinInstnId.Othr.Id",
      "headers.fspiop-destination": "body.Assgnmt.Assgne.Agt.FinInstnId.Othr.Id",
      "params.IdPath": "body.Rpt.OrgnlId"
    }`
  }
}

// FSPIOP to FSPIOP ISO220022 mappings

export const discovery_reverse = {
  parties: {
    put: `{
      "$noDefaults": true,
      "body.Assgnmt.MsgId": { "$transform": "generateID" },
      "body.Assgnmt.CreDtTm": { "$transform": "datetimeNow" },
      "body.Rpt.Vrfctn": [{ "$transform": "fixed", "value": true }],
      "body.Assgnmt.Assgnr.Agt.FinInstnId.Othr.Id": "headers.fspiop-source",
      "body.Assgnmt.Assgne.Agt.FinInstnId.Othr.Id": "headers.fspiop-destination",
      "body.Rpt.OrgnlId": "params.IdPath",
      "body.Rpt.UpdtdPtyAndAcctId.Pty.Id.OrgId.Othr.SchmeNm.Prtry": ["body.party.partyIdInfo.partyIdType", { "$filter": "isNotPersonParty" }],
      "body.Rpt.UpdtdPtyAndAcctId.Pty.Id.PrvtId.Othr.SchmeNm.Prtry": ["body.party.partyIdInfo.partyIdType", { "$filter": "isPersonParty" }],
      "body.Rpt.UpdtdPtyAndAcctId.Pty.Id.OrgId.Othr.Id": ["body.party.partyIdInfo.partyIdentifier", { "$filter": "isNotPersonParty" }],
      "body.Rpt.UpdtdPtyAndAcctId.Pty.Id.PrvtId.Othr.Id": ["body.party.partyIdInfo.partyIdentifier", { "$filter": "isPersonParty" }],
      "body.Rpt.UpdtdPtyAndAcctId.Agt.FinInstnId.Othr.Id": "body.party.partyIdInfo.fspId",
      "body.Rpt.UpdtdPtyAndAcctId.Pty.Nm": "body.party.name",
      "body.Rpt.UpdtdPtyAndAcctId.Acct.Ccy": ["body.party.supportedCurrencies", { "$transform": "supportedCurrenciesToString" }]
    }`,
    putError: `{
      "$noDefaults": true,
      "body.Rpt.Rsn.Cd": "body.errorInformation.errorCode",
      "body.Assgnmt.MsgId": { "$transform": "generateID" },
      "body.Assgnmt.CreDtTm": { "$transform": "datetimeNow" },
      "body.Assgnmt.Assgnr.Agt.FinInstnId.Othr.Id": "headers.fspiop-source",
      "body.Assgnmt.Assgne.Agt.FinInstnId.Othr.Id": "headers.fspiop-destination",
      "body.Rpt.OrgnlId": "params.IdPath",
      "body.Rpt.Vrfctn": [{ "$transform": "fixed", "value": false }]
    }`
  }
}
