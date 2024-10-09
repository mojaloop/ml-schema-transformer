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

import { createTransformer } from 'src';
import { Transformer } from 'src/lib';
import { Options } from 'src/types/map-transform';


describe('createTransformer tests', () => {
  test('should create and return a Transformer instance', async () => {
    const jsonParseSpy = vi.spyOn(JSON, 'parse');
    const mapping = {};
    const transformer = await createTransformer(mapping);
    expect(transformer).toBeDefined();
    expect(jsonParseSpy).not.toHaveBeenCalled();
    expect(transformer).toBeInstanceOf(Transformer);
  });
  test('should parse JSON string mapping and return a Transformer instance', async () => {
    const jsonParseSpy = vi.spyOn(JSON, 'parse');
    const mapping = '{}';
    const transformer = await createTransformer(mapping);
    expect(transformer).toBeDefined();
    expect(jsonParseSpy).toHaveBeenCalledWith(mapping);
    expect(transformer).toBeInstanceOf(Transformer);
  });
});