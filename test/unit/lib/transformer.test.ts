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

import { Transformer, createTransformer, transformFn } from '../../../src/lib';
import { State } from '../../../src/types/map-transform';
import { mockLogger } from 'test/fixtures';

describe('Transformer tests', () => {
  describe('createTransformer', () => {
    it('should create a new Transformer instance', async () => {
      const mapping = {
        partyType: 'partyIdInfo.partyIdType',
        partyIdentifier: 'partyIdInfo.partyIdentifier',
      };
      const transformer = await createTransformer(mapping);
      expect(transformer).toBeInstanceOf(Transformer);
    });
    it('should use custom transform functions if supplied', async () => {
      const source = {
        body: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: '1234567890',
          }
        }
      };
      const mappingStr = `{
        "body.partyType": "body.partyIdInfo.partyIdType",
        "body.partyIdentifier": ["body.partyIdInfo.partyIdentifier", { "$transform": "padLeft" }]
      }`;
      const mapping = JSON.parse(mappingStr);
      const padLeft = (options: any) => () => (value: any) => value.padStart(20, '0');
      const transformer = await createTransformer(mapping, { mapTransformOptions: { transformers: { padLeft } } });
      const target = await transformer.transform(source, {});
      expect(target).toEqual({
        body: {
          partyType: source.body.partyIdInfo.partyIdType,
          partyIdentifier: '00000000001234567890',
        }
      });
      expect(transformer).toBeInstanceOf(Transformer);
    })
  })
  describe('transformFn', () => {
    it('should transform source payload using supplied mapping', async () => {
      const source = {
        body: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: '1234567890',
          },
        }
      };
      const mapping = JSON.stringify({
        partyType: 'body.partyIdInfo.partyIdType',
        partyIdentifier: 'body.partyIdInfo.partyIdentifier',
      });
      const target = await transformFn(source, { mapping, logger: mockLogger });
      expect(target).toEqual({
        partyType: source.body.partyIdInfo.partyIdType,
        partyIdentifier: source.body.partyIdInfo.partyIdentifier,
      });
    });
    it('should throw an error if transformation fails', async () => {
      const source = {
        body: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: '1234567890',
          },
        }
      };
      await expect(transformFn(source, { mapping: 'invalid mapping', logger: mockLogger })).rejects.toThrow(Error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
  describe('Transformer', () => {
    describe('Transformer', () => {
      it('should transform source payload using supplied mapper', async () => {
        const mockMapper = vi.fn();
        const mockOptions = { mapperOptions: {} as State }
        const transformer = new Transformer(mockMapper);
        const source = {
          body: {
            party: 'MSISDN',
          }
        };
        await transformer.transform(source, mockOptions);
        expect(mockMapper).toHaveBeenCalledWith(source, mockOptions.mapperOptions);
      });
    });
  });
});
