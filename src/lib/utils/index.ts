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

const idGenerator = require('@mojaloop/central-services-shared').Util.id;
const { CreateFSPIOPErrorFromErrorCode } = require('@mojaloop/central-services-error-handling')
import * as ilpPacket from 'ilp-packet';
import { ConfigOptions, GenericObject, ID_GENERATOR_TYPE, Primitive, isContextLogger } from '../../types';
import { TransformDefinition } from '../../types/map-transform';
import { ContextLogger } from '@mojaloop/central-services-logger/src/contextLogger';

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
// e.g { a: { b: 1 } } and { a: { c: 2 } } => { a: { b: 1, c: 2 } }
export const deepMerge = (target: GenericObject, source: GenericObject): GenericObject => {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target, source);
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
  if (hasProp(config, 'logger') && !isContextLogger(config.logger as ContextLogger)) {
    throw new Error('Invalid logger provided');
  }
}

// Unrolls extensions array into an object
// e.g [ { key: 'key1', value: 'value1' }, { key: 'key2', value: 'value2' } ] => { key1: 'value1', key2: 'value2' }
export const unrollExtensions = (extensions: Array<{ key: string, value: unknown }>): GenericObject => {
  const unrolled: GenericObject = {};
  for (const { key, value } of extensions) {
    setProp(unrolled, key, value);
  }
  return unrolled;
}

// Rolls up unmapped properties (i.e properties in source object not found in the mapping values - r.h.s) into extensions array
// e.g { a: 1, b: 2 } => [ { key: 'a', value: 1 }, { key: 'b', value: 2 } ]
export const rollUpUnmappedAsExtensions = (source: GenericObject, mapping: TransformDefinition): Array<{ key: string, value: unknown }> => {
  const extensions = [];
  const mappingObj = mapping = typeof mapping === 'string' ? JSON.parse(mapping) : mapping;
  // we are only interested in body and $context mappings
  const mappingValues = extractValues(mappingObj)
    .map((value) => String(value))
    .filter((value) => value.startsWith('body.') || value.startsWith('$context.'))
    .map((value) => value.replace('body.', ''))
    .map((value) => value.replace(/\$context\.[a-zA-Z0-9]+./, ''));
  // for the source, we are only interested in body
  const sourcePaths = getObjectPaths(source.body);

  for (const path of sourcePaths) {
    if (!mappingValues.includes(path)) {
      const value = getProp(source.body, path);
      extensions.push({ key: path, value });
    }
  }

  return extensions;
}

// Extracts all leaf values from an object including values nested in arrays and objects
// e.g { a: { b: 1, c: { d: 2, e: [ 3, 4 ] } } } => [1, 2, 3, 4]
export const extractValues = (obj: GenericObject) => {
  const values: Primitive[] = [];

  function recurse(current: GenericObject | Primitive | null) {
    if (Array.isArray(current)) {
      current.forEach(item => recurse(item));
    } else if (typeof current === 'object' && current !== null) {
      Object.values(current).forEach(value => recurse(value));
    } else { 
      values.push((current as Primitive));
    }
  }

  recurse(obj);
  return values;
}

// Gets all paths to leaf nodes in an object
// e.g { a: { b: 1, c: { d: 2 } } } => ['a.b', 'a.c.d']
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

// Removes duplicates from an array of objects based on a unique key
// e.g [ { id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 1, name: 'Alice' } ] => [ { id: 1, name: 'Alice' }, { id: 2, name: 'Bob' } ]
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
