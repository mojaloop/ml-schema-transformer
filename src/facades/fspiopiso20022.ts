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

import {
  ConfigOptions,
  FspiopTarget,
  IsoSource,
  FspiopPutQuotesTarget,
  FspiopPutPartiesTarget,
  FspiopPutPartiesErrorTarget,
  IsoFacadeOptions,
  TypeGuards,
  PartyIdParamsSource,
  isContextLogger
} from '../types';
import { logger as defaultLogger, transformFn } from '../lib';
import { FSPIO20022PMappings } from '../mappings';
import { getProp, hasProp, setProp, validateConfig } from '../lib/utils';
import { runPipeline } from '../lib/transforms/pipeline';
import { applyRollUpUnmappedAsExtensions } from '../lib/transforms/extensions';
import { ContextLogger } from '@mojaloop/central-services-logger/src/contextLogger';
import { TransformDefinition } from '../types/map-transform';
const { discovery, quotes, fxQuotes, transfers, fxTransfers } = FSPIO20022PMappings;

const Config: ConfigOptions = { logger: defaultLogger, rollUpUnmappedAsExtensions: false };
const afterTransformSteps = [ applyRollUpUnmappedAsExtensions ];

const createPipelineOptions = (options: IsoFacadeOptions, mapping: TransformDefinition) => {
  return {
    ...options,
    mapping,
    pipelineSteps: afterTransformSteps,
    logger: Config.logger as ContextLogger,
    rollUpUnmappedAsExtensions: hasProp(options, 'rollUpUnmappedAsExtensions')
      ? !!options.rollUpUnmappedAsExtensions
      : Config.rollUpUnmappedAsExtensions,
  };
};

// Facades for transforming FSPIOP ISO 20022 payloads to FSPIOP payloads
export const FspiopIso20022TransformFacade = {
  configure: (config: ConfigOptions) => {
    validateConfig(config);
    if (config.logger && isContextLogger(config.logger)) Config.logger = config.logger;
    if (hasProp(config, 'rollUpUnmappedAsExtensions')) Config.rollUpUnmappedAsExtensions = !!config.rollUpUnmappedAsExtensions;
  },
  parties: {
    put: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopPutPartiesTarget> => {
      if (!TypeGuards.FSPIOPISO20022.parties.put.isSource(source)) {
        throw new Error('Invalid source object for put parties');
      }
      const mapping = options.overrideMapping || discovery.parties.put;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping,
      });
      // split up IdPath
      const IdPath = getProp(target, 'params.IdPath') as string;
      if (IdPath) {
        const [Type, ID, SubId] = IdPath.split('/');
        setProp(target, 'params.Type', Type);
        setProp(target, 'params.ID', ID);
        if (SubId) setProp(target, 'params.SubId', SubId);
        delete (target.params as PartyIdParamsSource).IdPath;
      }
      // step-specific configuration
      const stepsConfig = {
        applyRollUpUnmappedAsExtensions: { extensionListProperty: 'body.party.partyIdInfo.extensionList' }
      };
      options = { ...options, ...stepsConfig };
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopPutPartiesTarget;
    },
    putError: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopPutPartiesErrorTarget> => {
      if (!TypeGuards.FSPIOPISO20022.parties.putError.isSource(source)) {
        throw new Error('Invalid source object for put parties error');
      }
      const mapping = options.overrideMapping || discovery.parties.putError;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });

      // split up IdPath
      const IdPath = getProp(target, 'params.IdPath') as string;
      if (IdPath) {
        const [Type, ID, SubId] = IdPath.split('/');
        setProp(target, 'params.Type', Type);
        setProp(target, 'params.ID', ID);
        if (SubId) setProp(target, 'params.SubId', SubId);
        delete (target.params as PartyIdParamsSource).IdPath;
      }
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopPutPartiesErrorTarget;
    },
  },
  quotes: {
    post: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.quotes.post.isSource(source)) {
        throw new Error('Invalid source object for post quotes');
      }
      const mapping = options.overrideMapping || quotes.post;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });

      /**
       * Mutate the target object here if necessary e.g complex scenarios that cannot be mapped directly in the mappings,
       * e.g one-sided mappings, or where the mappings are not sufficient to cover all scenarios.
       * We do not apply these mutations if there is mapping override.
       */
      if (!options.overrideMapping) {
        setProp(target, 'body.amountType', getProp(source, 'body.CdtTrfTxInf.ChrgBr') === 'DEBT' ? 'RECEIVE' : 'SEND');
        if (getProp(source, 'body.CdtTrfTxInf.InstrForCdtrAgt.Cd') === 'REFD') {
          setProp(target, 'body.transactionType.refundInfo.reason', getProp(source, 'body.CdtTrfTxInf.InstrForCdtrAgt.InstrInf'));
        }
        if (getProp(source, 'body.CdtTrfTxInf.PmtId.InstrId')) {
          setProp(target, 'body.transactionType.initiator', 'PAYEE');
        } else {
          setProp(target, 'body.transactionType.initiator', 'PAYER');
        }
        if (getProp(source, 'body.CdtTrfTxInf.PmtId.InstrId')) {
          if (getProp(source, 'body.CdtTrfTxInf.Cdr.Id.Pty')) {
            setProp(target, 'body.transactionType.initiatorType', 'CONSUMER');
          } else {
            setProp(target, 'body.transactionType.initiatorType', 'BUSINESS');
          }
        } else {
          if (getProp(source, 'body.CdtTrfTxInf.Dtr.Id.Pty')) {
            setProp(target, 'body.transactionType.initiatorType', 'CONSUMER');
          } else {
            setProp(target, 'body.transactionType.initiatorType', 'BUSINESS');
          }
        }
      }

      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
    put: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopPutQuotesTarget> => {
      if (!TypeGuards.FSPIOPISO20022.quotes.put.isSource(source)) {
        throw new Error('Invalid source object for put quotes');
      }
      const mapping = options.overrideMapping || quotes.put;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopPutQuotesTarget;
    },
    putError: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.quotes.putError.isSource(source)) {
        throw new Error('Invalid source object for put quotes error');
      }
      const mapping = options.overrideMapping || quotes.putError;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
  },
  transfers: {
    post: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.transfers.post.isSource(source)) {
        throw new Error('Invalid source object for post transfers');
      }
      const mapping = options.overrideMapping || transfers.post;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
    patch: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.transfers.patch.isSource(source)) {
        throw new Error('Invalid source object for patch transfers');
      }
      const mapping = options.overrideMapping || transfers.patch;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
    put: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.transfers.put.isSource(source)) {
        throw new Error('Invalid source object for put transfers');
      }
      const mapping = options.overrideMapping || transfers.put;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
    putError: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.transfers.putError.isSource(source)) {
        throw new Error('Invalid source object for put transfers error');
      }
      const mapping = options.overrideMapping || transfers.putError;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
  },
  fxQuotes: {
    post: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.fxQuotes.post.isSource(source)) {
        throw new Error('Invalid source object for post fxQuotes');
      }
      const mapping = options.overrideMapping || fxQuotes.post;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      // step-specific configuration
      const stepsConfig = {
        applyRollUpUnmappedAsExtensions: { extensionListProperty: 'body.conversionTerms.extensionList' }
      };
      options = { ...options, ...stepsConfig };
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
    put: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.fxQuotes.put.isSource(source)) {
        throw new Error('Invalid source object for put fxQuotes');
      }
      const mapping = options.overrideMapping || fxQuotes.put;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      // step-specific configuration
      const stepsConfig = {
        applyRollUpUnmappedAsExtensions: { extensionListProperty: 'body.conversionTerms.extensionList' }
      };
      options = { ...options, ...stepsConfig };
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
    putError: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.fxQuotes.putError.isSource(source)) {
        throw new Error('Invalid source object for put fxQuotes error');
      }
      const mapping = options.overrideMapping || fxQuotes.putError;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
  },
  fxTransfers: {
    post: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.fxTransfers.post.isSource(source)) {
        throw new Error('Invalid source object for post fxTransfers');
      }
      const mapping = options.overrideMapping || fxTransfers.post;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
    patch: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.fxTransfers.patch.isSource(source)) {
        throw new Error('Invalid source object for patch fxTransfers');
      }
      const mapping = options.overrideMapping || fxTransfers.patch;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
    put: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.fxTransfers.put.isSource(source)) {
        throw new Error('Invalid source object for put fxTransfers');
      }
      const mapping = options.overrideMapping || fxTransfers.put;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    },
    putError: async (source: IsoSource, options: IsoFacadeOptions = {}): Promise<FspiopTarget> => {
      if (!TypeGuards.FSPIOPISO20022.fxTransfers.putError.isSource(source)) {
        throw new Error('Invalid source object for put fxTransfers error');
      }
      const mapping = options.overrideMapping || fxTransfers.putError;
      const target = await transformFn(source, {
        ...options,
        logger: Config.logger as ContextLogger,
        mapping
      });
      // apply additional transformation steps to target via pipeline
      const pipelineOptions = createPipelineOptions(options, mapping);
      return runPipeline(source, target, pipelineOptions) as FspiopTarget;
    }
  },
};
