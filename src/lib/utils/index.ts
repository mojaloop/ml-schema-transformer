/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Steven Oderayi <steven.oderayi@infitx.com>
 --------------
 ******/

const idGenerator = require('@mojaloop/central-services-shared').Util.id;
const { CreateFSPIOPErrorFromErrorCode } = require('@mojaloop/central-services-error-handling')
import ilpPacket from 'ilp-packet';
import { ConfigOptions, GenericObject, ID_GENERATOR_TYPE, isContextLogger } from '../../types';
import { TransformDefinition } from 'src/types/map-transform';

// improve: use enums from cs-shared
// We only cover the states that are externally visible
const fspiopToIsoTransferStateMap: GenericObject = {
  COMMITTED: 'COMM',
  RESERVED: 'RESV',
  RECEIVED: 'RECV',
  ABORTED: 'ABOR'
}

// Generates a unique ID
export const generateID = (idGenType: ID_GENERATOR_TYPE = ID_GENERATOR_TYPE.ulid, config: GenericObject = {}): string => {
  switch (idGenType) {
    case ID_GENERATOR_TYPE.ulid:
    case ID_GENERATOR_TYPE.uuid:
      return idGenerator({ ...config, type: idGenType })();
    default:
      return idGenerator({ ...config, type: ID_GENERATOR_TYPE.ulid })();
  }
}

// improve: import enums from cs-shared
export const isPersonPartyIdType = (partyIdType: string) => partyIdType && !['BUSINESS', 'ALIAS', 'DEVICE'].includes(partyIdType);

export const isEmptyObject = (data: unknown) => {
  return typeof data === 'object' && data !== null && Object.keys(data as object).length === 0;
}

// Safely sets nested property in an object
export const setProp = (obj: unknown, path: string, value: unknown) => {
  const pathParts = path.split('.');
  let current = obj as GenericObject;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i] as string;
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }
  current[pathParts[pathParts.length - 1] as string] = value;
}

// Safely gets nested property from an object
export const getProp = (obj: unknown, path: string): unknown  => {
  const pathParts = path.split('.');
  let current = obj;
  for (const part of pathParts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as GenericObject)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

// Safely checks if nested property exists in an object
export const hasProp = (obj: unknown, path: string): boolean => {
  const pathParts = path.split('.');
  let current = obj;
  for (const part of pathParts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as GenericObject)[part];
    } else {
      return false;
    }
  }

  return true;
}

// Merges deeply nested objects
export const deepMerge = (target: GenericObject, source: GenericObject): GenericObject => {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

// Gets the description for an error code
export const getDescrForErrCode = (code: string | number): string => {
  try {
    const errorCode = Number.parseInt(code as string);
    const errorCreated = CreateFSPIOPErrorFromErrorCode(errorCode);
    return errorCreated?.apiErrorCode?.type?.description;
  } catch (error) {
    return 'Unknown error';
  }
}

// Gets the ILP packet condition from an ILP packet
export const getIlpPacketCondition = (inputIlpPacket: string): string => {
  const binaryPacket = Buffer.from(inputIlpPacket, 'base64');
  const decoded = ilpPacket.deserializeIlpPrepare(binaryPacket);
  return decoded?.executionCondition?.toString('base64url');
}

// Converts FSPIOP transfer state to FSPIOP ISO20022 transfer state
export const toIsoTransferState = (fspiopState: string): string | undefined => {
  if (!fspiopState) return undefined;
  const isoState = fspiopToIsoTransferStateMap[fspiopState] as string;
  if (!isoState) throw new Error(`toIsoTransferState: Unknown FSPIOP transfer state: ${fspiopState}`);
  return isoState;
}

// Converts FSPIOP ISO20022 transfer state to FSPIOP transfer state
export const toFspiopTransferState = (isoState: string): string | undefined => {
  if (!isoState) return undefined;
  for (const [key, value] of Object.entries(fspiopToIsoTransferStateMap)) {
    if (value === isoState) return key;
  }
  throw new Error(`toFspiopTransferState: Unknown ISO20022 transfer state: ${isoState}`);
}

// Validates configuration options
export const validateConfig = (config: ConfigOptions): void => {
  if (hasProp(config, 'logger') && !isContextLogger(config.logger)) {
    throw new Error('Invalid logger provided');
  }
}

// Unrolls extensions array into an object
export const unrollExtensions = (extensions: Array<{ key: string, value: unknown }>): GenericObject => {
  const unrolled: GenericObject = {};
  for (const { key, value } of extensions) {
    setProp(unrolled, key, value);
  }
  return unrolled;
}

// Rolls up unmapped properties into extensions array
export const rollupUnmappedIntoExtensions = (source: GenericObject, mapping: TransformDefinition): Array<{ key: string, value: unknown }> => {
  const extensions = [];
  const mappingObj = mapping = typeof mapping === 'string' ? JSON.parse(mapping) : mapping;
  const mappingValues = extractValues(mappingObj);
  const sourcePaths = getObjectPaths(source);

  for (const path of sourcePaths) {
    if (!mappingValues.includes(path)) {
      const value = getProp(source, path);
      extensions.push({ key: path, value });
    }
  }

  return extensions;
}

// Extracts all values from an object including nested values in arrays and objects
export const extractValues = (obj: GenericObject) => {
  const values: string[] = [];

  function recurse(current: GenericObject | string | number | boolean | null) {
    if (Array.isArray(current)) {
      current.forEach(item => recurse(item));
    } else if (typeof current === 'object' && current !== null) {
      Object.values(current).forEach(value => recurse(value));
    } else if ((current as string).includes('.')) { // all fields in our mappings have dots
      // remove the first part of the path e.g body, header, params before adding to values
      values.push((current as string).split('.').slice(1).join('.'));
    }
  }

  recurse(obj);
  return values;
}

export const getObjectPaths = (obj: GenericObject, prefix = '') => {
  let paths: string[] = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        paths = paths.concat(getObjectPaths(obj[key], path));
      } else {
        paths.push(path);
      }
    }
  }

  return paths;
}

// Removes duplicate objects from an array based on a unique key
export const deduplicateObjectsArray = (arr: GenericObject[], uniqueKey: string): GenericObject[] => {
  const seen = new Set();
  return arr.reduce((acc: GenericObject[], obj) => {
    if (!seen.has(obj[uniqueKey])) {
      seen.add(obj[uniqueKey]);
      acc.push(obj);
    }
    return acc;
  }, []);
}

