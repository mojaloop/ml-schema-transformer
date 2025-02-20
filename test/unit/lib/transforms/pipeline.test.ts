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

import { mockLogger } from 'test/fixtures';
import { runPipeline } from '../../../../src/lib/transforms/pipeline';

describe('Pipeline', () => {
  describe('runPipeline', () => {
    it('should throw an error if options.pipelineSteps is not an array', () => {
      const source = {};
      const target = {};
      const options = {
        pipelineSteps: 'notAnArray'
      };
      expect(() => runPipeline(source, target, options)).toThrowError('runPipeline: options.pipelineSteps must be an array');
    });
    it('should run each step in the pipeline', () => {
      const source = {};
      const target = {};
      const options = {
        pipelineSteps: [
          vi.fn().mockReturnValue({}),
          vi.fn().mockReturnValue({}),
          vi.fn().mockReturnValue({})
        ],
        logger: mockLogger
      };
      runPipeline(source, target, options);
      for (const step of options.pipelineSteps) {
        expect(step).toHaveBeenCalledWith({ source, target, options: {}, logger: expect.any(Object) });
      }
    });
    it('should return the result of the last step', () => {
      const source = {};
      const target = {};
      const options = {
        pipelineSteps: [
          vi.fn().mockReturnValue({}),
          vi.fn().mockReturnValue({}),
          vi.fn().mockReturnValue({ finalResult: 'finalResult' })
        ]
      };
      const result = runPipeline(source, target, options);
      expect(result).toEqual({ finalResult: 'finalResult' });
    });
  });
});
