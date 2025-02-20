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

import { TransformFacades } from 'src';
import { GenericObject, Source, FspiopFacadeFunction } from 'src/types';
import { expectedFspiopIso20022Targets, expectedFspiopTargets, fspiopIso20022Sources, fspiopSources } from '../fixtures';
import { getProp } from 'src/lib/utils';
import { logger as defaultLogger } from '../../src/lib';

const PERF_THRESHOLD_MS = 2000;

const expected = (prop: string) => {
  return (target: GenericObject) => {
    return getProp(expectedFspiopIso20022Targets(target), prop);
  };
};

describe('Performance Test', () => {
  TransformFacades.FSPIOP.configure({
    logger: defaultLogger,
    isTestingMode: true
  });
  const perfTest = async (transformFn: FspiopFacadeFunction, source: Source, expectedTargetFn: (target: GenericObject) => unknown) => {
    let target;
    const startTime = performance.now();

    for (let i = 0; i < 1000; i++) target = await transformFn(source, {});

    const endTime = performance.now();
    const runtime = endTime - startTime;
    const expectedTarget = expectedTargetFn(target as GenericObject);
    expect(target).toEqual(expectedTarget);
    expect(runtime).toBeLessThan(PERF_THRESHOLD_MS);
    /* eslint-disable no-console */
    console.log(`Runtime: ${runtime}ms`);
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
  describe('TransformFacades.FSPIOPISO20022', () => {
    describe('quotes', () => {
      it('POST /quotes performance test', async () => {
        await perfTest(TransformFacades.FSPIOPISO20022.quotes.post, fspiopIso20022Sources.quotes.post, () => expectedFspiopTargets.quotes.post);
      });
    });
    describe('transfers', () => {
      it('POST /transfers performance test', async () => {
        await perfTest(TransformFacades.FSPIOPISO20022.transfers.post, fspiopIso20022Sources.transfers.post, () => expectedFspiopTargets.transfers.post);
      });
    });
  });
});
