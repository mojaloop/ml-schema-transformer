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

import { TransformFacades } from 'src';
import { GenericObject, Source, TransformFacadeFunction } from 'src/types';
import { expectedFspiopIso20022Targets, fspiopSources } from '../fixtures';
import { getProp } from 'src/lib/utils';

const PERF_THRESHOLD_MS = 1000;

const expected = (prop: string) => {
  return (target: GenericObject) => {
    return getProp(expectedFspiopIso20022Targets(target), prop);
  };
};

describe('Performance Test', () => {
  const perfTest = async (transformFn: TransformFacadeFunction, source: Source, expectedTargetFn: (target: GenericObject) => unknown) => {
    let target;

    const startTime = Date.now();

    for (let i = 0; i < 1000; i++) {
      target = await transformFn(source, {});
    }

    const endTime = Date.now();
    const runtime = endTime - startTime;

    const expectedTarget = expectedTargetFn(target as GenericObject);
    expect(target).toEqual(expectedTarget);
    expect(runtime).toBeLessThan(PERF_THRESHOLD_MS);
  };
  describe('TransformFacades.FSPIOP', () => {
    describe('quotes', () => {
      it('POST /quotes performance test', async () => {
        await perfTest(TransformFacades.FSPIOP.quotes.post, fspiopSources.quotes.post, expected('quotes.post'));
      });
    });
    describe('transfers', () => {
      it('POST /transfers performance test', async () => {
        await perfTest(TransformFacades.FSPIOP.transfers.post, fspiopSources.transfers.post, expected('transfers.post'));
      });
    });
  });
});