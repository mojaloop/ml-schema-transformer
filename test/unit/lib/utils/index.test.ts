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

import { ilpCondition, ilpPacket } from 'test/fixtures';
import {
  deduplicateObjectsArray,
  deepMerge,
  extractValues,
  generateID,
  getDescrForErrCode,
  getIlpPacketCondition,
  getObjectPaths,
  getProp,
  hasProp,
  isEmptyObject,
  isPersonPartyIdType,
  rollUpUnmappedAsExtensions,
  setProp,
  toFspiopTransferState,
  toIsoTransferState,
  unrollExtensions,
  validateConfig,
} from '../../../../src/lib/utils';
import { ID_GENERATOR_TYPE } from 'src/types';


describe('Utils tests', () => {
  describe('generateID', () => {
    it('should generate a unique ulid ID (default)', () => {
      const id = generateID();
      expect(id).toBeDefined();
      expect(id.length).toBe(26);
    });
    it('should generate a unique uuid ID', () => {
      const id = generateID(ID_GENERATOR_TYPE.uuid);
      expect(id).toBeDefined();
      expect(id.length).toBe(36);
    });
    it('should generate a unique ulid ID with a custom config', () => {
      const id = generateID(ID_GENERATOR_TYPE.ulid, { time: 1234567890 });
      expect(id).toBeDefined();
      expect(id.length).toBe(26);
    })
    it('should generate a unique ulid ID with an unknown type', () => {
      const id = generateID('unknown' as ID_GENERATOR_TYPE);
      expect(id).toBeDefined();
      expect(id.length).toBe(26);
    });
  });
  describe('isPersonPartyIdType', () => {
    it('should return true for a person party ID type', () => {
      const partyIdType = 'MSISDN';
      const isPerson = isPersonPartyIdType(partyIdType);
      expect(isPerson).toBe(true);
    });
    it('should return false for a business party ID type', () => {
      const partyIdType = 'BUSINESS';
      const isPerson = isPersonPartyIdType(partyIdType);
      expect(isPerson).toBe(false);
    });
  });
  describe('isEmptyObject', () => {
    it('should return true for an empty object', () => {
      const isEmpty = isEmptyObject({});
      expect(isEmpty).toBe(true);
    });
    it('should return false for a non-empty object', () => {
      const isEmpty = isEmptyObject({ key: 'value' });
      expect(isEmpty).toBe(false);
    });
  });
  describe('setProp', () => {
    it('should set a nested property in an object', () => {
      const obj = {};
      setProp(obj, 'nested.property', 'value');
      expect(obj).toEqual({ nested: { property: 'value' } });
    });
  });
  describe('getProp', () => {
    it('should get a nested property from an object', () => {
      const obj = { nested: { property: 'value' } };
      const value = getProp(obj, 'nested.property');
      expect(value).toBe('value');
    });
    it('should return undefined for a non-existent property', () => {
      const obj = { nested: { property: 'value' } };
      const value = getProp(obj, 'nested.nonexistent');
      expect(value).toBeUndefined();
    })
  });
  describe('hasProp', () => {
    it('should return true for an existing property', () => {
      const obj = { nested: { property: 'value' } };
      expect(hasProp(obj, 'nested.property')).toBe(true)
    });
    it('should return false for a non-existent property', () => {
      const obj = { nested: { property: 'value' } };
      expect(hasProp(obj, 'nested.nonexistent')).toBe(false);
    });
  });
  describe('deepMerge', () => {
    it('should merge two objects deeply', () => {
      const obj1 = { key1: 'value1', nested: { key2: 'value2' } };
      const obj2 = { key1: 'value3', nested: { key2: 'value4' } };
      const merged = deepMerge(obj1, obj2);
      expect(merged).toEqual({ key1: 'value3', nested: { key2: 'value4' } });
    });
    it('should merge two objects with nested arrays', () => {
      const obj1 = { key1: 'value1', nested: { key2: ['value2'] } };
      const obj2 = { key1: 'value3', nested: { key2: ['value4'] } };
      const merged = deepMerge(obj1, obj2);
      expect(merged).toEqual({ key1: 'value3', nested: { key2: ['value4'] } });
    });
    it('should merge two objects with nested objects', () => {
      const obj1 = { key1: 'value1', nested: { key2: { key3: 'value2' } } };
      const obj2 = { key1: 'value3', nested: { key2: { key3: 'value4' } } };
      const merged = deepMerge(obj1, obj2);
      expect(merged).toEqual({ key1: 'value3', nested: { key2: { key3: 'value4' } } });
    });
  });
  describe('getDescrForErrCode', () => {
    it('should return a description from an error code', () => {
      const description = getDescrForErrCode('3100');
      expect(description).toBe('Client Validation Error');
    });
    it('should throw an error for an unknown error code', () => {
      expect(() => getDescrForErrCode('9999')).not.toThrow();
      expect(getDescrForErrCode('9999')).toBe('Unknown error');
    });
  });
  describe('getIlpPacketCondition', () => {
    it('should get the condition from an ILP packet', () => {
      const condition = getIlpPacketCondition(ilpPacket);
      expect(condition).toBe(ilpCondition);
    });
    it('should throw an error for an invalid ILP packet', () => {
      expect(() => getIlpPacketCondition('invalid packet')).toThrow();
    });
  });
  describe('toIsoTransferState', () => {
    it('should return undefined if state is falsy', () => {
      const state = toIsoTransferState(null as any);
      expect(state).toBe(undefined);
    });
    it('should convert FSPIOP transfer state to an ISO 20022 state', () => {
      let state = toIsoTransferState('COMMITTED');
      expect(state).toBe('COMM');
      state = toIsoTransferState('ABORTED');
      expect(state).toBe('ABOR');
      state = toIsoTransferState('RECEIVED');
      expect(state).toBe('RECV');
      state = toIsoTransferState('RESERVED');
      expect(state).toBe('RESV');
    });
    it('should throw an error for an unknown state', () => {
      expect(() => toIsoTransferState('UNKNOWN')).toThrow();
    });
  });
  describe('toFspiopTransferState', () => {
    it('should return undefined if state is falsy', () => {
      const state = toFspiopTransferState(null as any);
      expect(state).toBe(undefined);
    });
    it('should convert ISO 20022 transfer state to an FSPIOP state', () => {
      let state = toFspiopTransferState('COMM');
      expect(state).toBe('COMMITTED');
      state = toFspiopTransferState('ABOR');
      expect(state).toBe('ABORTED');
      state = toFspiopTransferState('RECV');
      expect(state).toBe('RECEIVED');
      state = toFspiopTransferState('RESV');
      expect(state).toBe('RESERVED');
    });
    it('should throw an error for an unknown state', () => {
      expect(() => toFspiopTransferState('UNKNOWN')).toThrow();
    });
  });
  describe('validateConfig', () => {
    it('should throw if invalid logger is provided', () => {
      const config = { logger: {} };
      expect(() => validateConfig(config as any)).toThrow('Invalid logger provided');
    });
  });
  describe('unrollExtensions', () => {
    it('should unroll an array of extensions into an object', () => {
      const extensions = [{ key: 'key1', value: 'value1' }, { key: 'key2', value: 'value2' }];
      const expectedUnrolled = { key1: 'value1', key2: 'value2' };
      const unrolled = unrollExtensions(extensions);
      expect(unrolled).toEqual(expectedUnrolled);

      const empty = unrollExtensions([]);
      expect(empty).toEqual({});

      const single = unrollExtensions([{ key: 'key', value: 'value' }]);
      expect(single).toEqual({ key: 'value' });

      const nested = unrollExtensions([{ key: 'nested.key', value: 'value' }]);
      expect(nested).toEqual({ nested: { key: 'value' } });
    });
  });
  describe('rollUpUnmappedAsExtensions', () => {
    it('should rollup unmapped properties into an extensions array', () => {
      const source = { 
        body: { key1: 'value1', key2: 'value2', key3: 'value3', key4: 'value4', key5: { key6: { key7: 'value7' } } },
        headers: { header1: 'value1', header2: 'value2' },
        params: { param1: 'value1', param2: 'value2' }
      };
      const mapping = {
        body: { key1: 'body.key1', key2: 'body.key2' }
      };
      const extensions = [
        { key: 'key3', value: 'value3' },
        { key: 'key4', value: 'value4' },
        { key: 'key5.key6.key7', value: 'value7' }
      ];
      const rolled = rollUpUnmappedAsExtensions(source, mapping);
      expect(rolled).toEqual(extensions);
    });
    it('should return an empty array if all properties are mapped', () => {
      const source = { body: { key1: 'value1', key2: 'value2' } };
      const mapping = {
        body: { key1: 'body.key1', key2: 'body.key2' }
      };
      const rolled = rollUpUnmappedAsExtensions(source, mapping);
      expect(rolled).toEqual([]);
    });
    it('should parse a JSON string mapping', () => {
      const source = { body: { key1: 'value1', key2: 'value2' } };
      const mapping = JSON.stringify({
        body: { key1: 'body.key1', key2: 'body.key2' }
      });
      const rolled = rollUpUnmappedAsExtensions(source, mapping);
      expect(rolled).toEqual([]);
    });
  });
  describe('extractValues', () => {
    it('should extract all values from an object', () => {
      const obj = { a: { b: 1, c: { d: 2, e: [3, '4'] } } };
      const values = extractValues(obj);
      expect(values).toEqual([1, 2, 3, '4']);
    });
  });
  describe('getObjectPaths', () => {
    it('should get all paths to leaf nodes in an object', () => {
      const obj = { a: { b: 1, c: { d: 2 } } };
      const paths = getObjectPaths(obj);
      expect(paths).toEqual(['a.b', 'a.c.d']);
    });
  });
  describe('deduplicateObjectsArray', () => {
    it('should deduplicate an array of objects', () => {
      const arr = [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'a' }];
      const deduped = deduplicateObjectsArray(arr, 'key');
      expect(deduped).toEqual([{ key: 'a' }, { key: 'b' }, { key: 'c' }]);
    });
  });
});
