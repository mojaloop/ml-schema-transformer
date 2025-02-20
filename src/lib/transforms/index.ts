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

import { ICustomTransforms } from '../../types';
import { Options, State } from '../../types/map-transform';
import { generateID as genID, getDescrForErrCode, getIlpPacketCondition, isEmptyObject, isPersonPartyIdType, toFspiopTransferState, toIsoTransferState } from '../utils';

export const CustomTransforms: ICustomTransforms = {
  generateID: (options: Options) => () => (data: unknown, state: State) => {
    return genID();
  },

  datetimeNow: (options: Options) => () => (data: unknown, state: State) => {
    return new Date().toISOString(); // Not sure if this is the correct format
  },

  isPersonParty: (options: Options) => () => (data: unknown, state: State) => {
    return isPersonPartyIdType(data as string);
  },

  isNotPersonParty: (options: Options) => () => (data: unknown, state: State) => {
    return !isPersonPartyIdType(data as string);
  },

  isNotEmpty: (options: Options) => () => (data: unknown, state: State) => {
    return data && !isEmptyObject(data);
  },

  fspiopErrorDescrForCode: (options: Options) => () => (data: unknown, state: State) => {
    return getDescrForErrCode(data as string);
  },

  ilpPacketToCondition: (options: Options) => () => (data: unknown, state: State) => {
    return getIlpPacketCondition(data as string);
  },

  toFspiopTransferState: (options: Options) => () => (data: unknown, state: State) => {
    return toFspiopTransferState(data as string);
  },

  toIsoTransferState: (options: Options) => () => (data: unknown, state: State) => {
    return toIsoTransferState(data as string);
  },

  supportedCurrenciesToString: (options: Options) => () => (data: unknown, state: State) => {
    return data && Array.isArray(data) && data.length > 0 ? data[0] : data;
  },

  toArray: (options: Options) => () => (data: unknown, state: State) => {
    if (data) {
      return Array.isArray(data) ? data : [data];
    }

    return undefined;
  }
}
