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

import { logger as defaultLogger, transformFn } from '../lib';
import { getProp, hasProp, setProp, validateConfig } from '../lib/utils';
import { FSPIO20022PMappings } from '../mappings';
import { fxTransfers_reverse } from '../mappings/fspiopiso20022';
import {
  ConfigOptions,
  FspiopPutPartiesErrorSource,
  FspiopPutPartiesSource,
  FspiopPutQuotesSource,
  FspiopSource,
  FspiopPostTransfersSource,
  IsoTarget,
  FspiopFacadeOptions,
  TypeGuards,
  isContextLogger
} from '../types';
import { runPipeline } from '../lib/transforms/pipeline';
import { applyUnrollExtensions } from '../lib/transforms/extensions';
const { discovery_reverse, quotes_reverse, transfers_reverse, fxQuotes_reverse } = FSPIO20022PMappings;

const Config: ConfigOptions = { logger: defaultLogger, isTestingMode: false, unrollExtensions: false }; 
const afterTransformSteps = [ applyUnrollExtensions ];

const createPipelineOptions = (options: FspiopFacadeOptions) => {
  return {
    ...options,
    pipelineSteps: afterTransformSteps,
    logger: Config.logger,
    unrollExtensions: hasProp(options, 'unrollExtensions')
      ? !!options.unrollExtensions
      : Config.unrollExtensions,
  };
};

// Facades for transforming FSPIOP payloads to FSPIOP ISO 20022 payloads
export const FspiopTransformFacade = {
  configure: (config: ConfigOptions) => {
    validateConfig(config);
    if (isContextLogger(config.logger)) Config.logger = config.logger;
    if (hasProp(config, 'isTestingMode')) Config.isTestingMode = !!config.isTestingMode;
    if (hasProp(config, 'unrollExtensions')) Config.unrollExtensions = !!config.unrollExtensions;
  },
  parties: {
    put: async (source: FspiopPutPartiesSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.parties.put.isSource(source)) {
        throw new Error('Invalid source object for put parties');
      }
      // construct source.params.IdPath if not present
      if (!source.params.IdPath) {
        source.params.IdPath = `${source.params.Type}/${source.params.ID}`;
        if (source.params.SubId) {
          source.params.IdPath += `/${source.params.SubId}`;
        }
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || discovery_reverse.parties.put,
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
    putError: async (source: FspiopPutPartiesErrorSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.parties.putError.isSource(source)) {
        throw new Error('Invalid source object for put parties error');
      }
      // construct source.params.IdPath if not present
      if (!source.params.IdPath) {
        source.params.IdPath = `${source.params.Type}/${source.params.ID}`;
        if (source.params.SubId) {
          source.params.IdPath += `/${source.params.SubId}`;
        }
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || discovery_reverse.parties.putError,
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
  },
  quotes: {
    post: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.quotes.post.isSource(source)) {
        throw new Error('Invalid source object for post quotes');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || quotes_reverse.post
      });
      /**
       * Mutate the target object here if necessary e.g complex scenarios that cannot be mapped directly in the mappings,
       * e.g one-sided mappings, or where the mappings are not sufficient to cover all scenarios.
       * We do not apply these mutations if there is mapping override.
       */
      if (!options.overrideMapping) {
        setProp(target, 'body.CdtTrfTxInf.ChrgBr', getProp(source, 'body.amountType') === 'SEND' ? 'CRED' : 'DEBT');

        if (getProp(source, 'body.transactionType.refundInfo')) {
          setProp(target, 'body.CdtTrfTxInf.InstrForCdtrAgt.Cd', 'REFD');
          setProp(target, 'body.CdtTrfTxInf.InstrForCdtrAgt.InstrInf', getProp(source, 'body.transactionType.refundInfo.reason'));
        }
      }
 
 // apply additional transformation steps to target via pipeline     const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
    put: async (source: FspiopPutQuotesSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.quotes.put.isSource(source)) throw new Error('Invalid source object for put quotes');
      if (!Config.isTestingMode && !source.$context) throw new Error('Invalid source object for put quotes, missing $context');
      const defaultMapping = Config.isTestingMode ? quotes_reverse.putTesting : quotes_reverse.put;
      const mapping = options.overrideMapping || defaultMapping;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping,
      }) as IsoTarget;
      if (!source.body.payeeFspFee && hasProp(target, 'body.CdtTrfTxInf.ChrgsInf.Agt.FinInstnId.Othr.Id')) {
        delete target.body.CdtTrfTxInf.ChrgsInf;
      }
 
 // apply additional transformation steps to target via pipeline     const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
    putError: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.quotes.putError.isSource(source)) {
        throw new Error('Invalid source object for put quotes error');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || quotes_reverse.putError,
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
  },
  transfers: {
    post: async (source: FspiopPostTransfersSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.transfers.post.isSource(source)) {
        throw new Error('Invalid source object for post transfers');
      }
      if (!Config.isTestingMode && !source.$context) {
        throw new Error('Invalid source object for post transfers, missing $context');
      }
      const defaultMapping = Config.isTestingMode ? transfers_reverse.postTesting : transfers_reverse.post;
      const mapping = options.overrideMapping || defaultMapping;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping,
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
    patch: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.transfers.patch.isSource(source)) {
        throw new Error('Invalid source object for patch transfers');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || transfers_reverse.patch
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
    put: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.transfers.put.isSource(source)) {
        throw new Error('Invalid source object for put transfers');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || transfers_reverse.put
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
    putError: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.transfers.putError.isSource(source)) {
        throw new Error('Invalid source object for put transfers error');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || transfers_reverse.putError
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
  },
  fxQuotes: {
    post: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.fxQuotes.post.isSource(source)) {
        throw new Error('Invalid source object for post fxQuotes');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || fxQuotes_reverse.post
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
    put: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.fxQuotes.put.isSource(source)) {
        throw new Error('Invalid source object for put fxQuotes');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || fxQuotes_reverse.put
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
    putError: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.fxQuotes.putError.isSource(source)) {
        throw new Error('Invalid source object for put fxQuotes error');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || fxQuotes_reverse.putError
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
  },
  fxTransfers: {
    post: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.fxTransfers.post.isSource(source)) {
        throw new Error('Invalid source object for post fxTransfers');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || fxTransfers_reverse.post
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
    patch: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.fxTransfers.patch.isSource(source)) {
        throw new Error('Invalid source object for patch fxTransfers');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || fxTransfers_reverse.patch
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
    put: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.fxTransfers.put.isSource(source)) {
        throw new Error('Invalid source object for put fxTransfers');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || fxTransfers_reverse.put
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
    putError: async (source: FspiopSource, options: FspiopFacadeOptions = {}): Promise<IsoTarget> => {
      if (!TypeGuards.FSPIOP.fxTransfers.putError.isSource(source)) {
        throw new Error('Invalid source object for put fxTransfers error');
      }
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger,
        mapping: options.overrideMapping || fxTransfers_reverse.putError
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options);
      return runPipeline(source, target, pipelineOptions) as IsoTarget;
    },
  },
};
