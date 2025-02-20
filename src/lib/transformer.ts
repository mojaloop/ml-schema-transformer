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

import { ITransformer, Source, Target, TransformFunctionOptions } from '../types';
import { DataMapper, State } from '../types/map-transform';
import { createTransformer } from './createTransformer';

export const transformFn = async (source: Partial<Source>, options: TransformFunctionOptions): Promise<Partial<Target>> => {
  const { mapping, mapTransformOptions, mapperOptions, logger } = options;
  try {
    const transformer = createTransformer(mapping, { mapTransformOptions });
    return transformer.transform(source, { mapperOptions });
  } catch (error) {
    logger.error('Error transforming payload with supplied mapping', { error, source, mapping });
    throw error;
  }
};

export class Transformer implements ITransformer {
  mapper: DataMapper;
  
  constructor(mapper: DataMapper) {
    this.mapper = mapper;
  }

  async transform(source: Partial<Source>, { mapperOptions }: { mapperOptions?: State } = {}): Promise<Partial<Target>> {
    return this.mapper(source, mapperOptions) as Promise<Partial<Target>>;
  }
}
