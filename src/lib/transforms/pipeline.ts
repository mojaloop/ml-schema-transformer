/*****
 License
 --------------
 Copyright © 2020-2024 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not 
 use these files except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES 
 OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 
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

import { GenericObject } from '../../types';

// Runs a pipeline of transformation steps on the source object and returns the target object
export const runPipeline = (source: GenericObject, target: GenericObject, options: GenericObject): GenericObject => {
  if (!options.hasOwnProperty('pipelineSteps') || !Array.isArray(options.pipelineSteps)) {
    throw new Error('runPipeline: options.pipelineSteps must be an array');
  }
  const { pipelineSteps, logger, ...stepOptions } = options;
  for (const step of pipelineSteps) {
    target = step({ source, target, options: stepOptions, logger });
  }
  return target;
};