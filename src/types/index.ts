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

import { ContextLogger } from '@mojaloop/central-services-logger/src/contextLogger';
import { AsyncTransformer, Options, State, TransformDefinition, Transformer } from './map-transform';

export interface ITransformer {
  transform(source: Partial<Source>, { mapperOptions }: { mapperOptions?: State }): Promise<Partial<Target>>;
}

export type FacadeOptions = { overrideMapping?: TransformDefinition, mapTransformOptions?: Options, mapperOptions?: State };

export type FspiopFacadeOptions = FacadeOptions & { unrollExtensions?: boolean };
export type FspiopFacadeFunction = (source: Source, options: FacadeOptions) => Promise<IsoTarget>;
export type IsoFacadeOptions = FacadeOptions & { rollUpUnmappedAsExtensions?: boolean };
export type IsoFacadeFunction = (source: IsoSource, options: FacadeOptions) => Promise<Partial<Target>>;

export type TransformFunctionOptions = { mapping: TransformDefinition, mapperOptions?: State, mapTransformOptions?: Options, logger: ContextLogger };
export type CreateTransformerOptions = { mapTransformOptions?: Options };

export enum ID_GENERATOR_TYPE {
  ulid = 'ulid',
  uuid = 'uuid'
}

export interface ICustomTransforms {
  [key: string | symbol]: Transformer | AsyncTransformer
}

export type ConfigOptions = {
  logger?: ContextLogger;
  isTestingMode?: boolean;
  unrollExtensions?: boolean;
  rollUpUnmappedAsExtensions?: boolean;
}

export type Headers = {
  'fspiop-source': string;
  'fspiop-destination': string;
}

export type Params = {
  Type?: string;
  ID?: string;
  SubId?: string;
}

export type PartyIdParamsSource = {
  Type: string;
  ID: string;
  SubId?: string;
  IdPath?: string; // format: IdType/IdValue or IdType/IdValue/SubIdValue
} | {
  Type?: string;
  ID?: string;
  SubId?: string;
  IdPath: string; // format: IdType/IdValue or IdType/IdValue/SubIdValue
}

export type PartyIdParamsTarget = {
  Type: string;
  ID: string;
  SubId?: string;
}

export type Source = {
  body: GenericObject;
  headers?: Headers;
  params?: Partial<Params>;
}

export type Target = {
  body: GenericObject;
  headers: Headers;
  params: Params;
};

export type FspiopSource = Pick<Source, 'body'>;
export type FspiopTarget = Pick<Target, 'body'>;
export type FspiopPutQuotesSource = { body: GenericObject, params: Pick<Params, 'ID'>,  $context?: { isoPostQuote: GenericObject }, headers?: Headers } | {body: GenericObject, params: Pick<Params, 'ID'>, headers: Headers, $context?: { isoPostQuote: GenericObject } };
export type FspiopPutQuotesTarget = { body: GenericObject, headers: Headers, params: Pick<Params, 'ID'> };
export type FspiopPutPartiesSource = { body: GenericObject, headers: Headers, params: PartyIdParamsSource };
export type FspiopPutPartiesTarget = { body: GenericObject, headers: Headers, params: PartyIdParamsTarget };
export type FspiopPutPartiesErrorSource = { body: GenericObject, headers: Headers, params: PartyIdParamsSource };
export type FspiopPutPartiesErrorTarget = { body: GenericObject, headers: Headers, params: PartyIdParamsTarget };
export type FspiopPostTransfersSource = { body: GenericObject,  $context?: { isoPostQuoteResponse: GenericObject }, headers?: Headers } | {body: GenericObject, params: Pick<Params, 'ID'>, headers: Headers, $context?: { isoPostQuoteResponse: GenericObject } };

export type IsoSource = Pick<Source, 'body'>;
export type IsoTarget = Pick<Target, 'body'>;

/* eslint-disable  @typescript-eslint/no-explicit-any */
export type GenericObject =  Record<string, any>;
export type Primitive = string | number | boolean;

// Pipeline types
export type PipelineStep = ({ source, target, options, logger }: { source: GenericObject, target: GenericObject, options: GenericObject, logger: ContextLogger }) => GenericObject;
export type PipelineStepsConfig = { [key: string]: GenericObject };
export type PipelineOptions = {
  pipelineSteps: PipelineStep[];
  logger: ContextLogger;
  [key: string]: any;
}


export type Json = string | number | boolean | Json[] | { [key: string]: Json };
export type LogContext = Json | string | null;
export const logLevelsMap = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  verbose: 'verbose',
  debug: 'debug',
  silly: 'silly',
  audit: 'audit',
  trace: 'trace',
  perf: 'perf',
} as const;

export const logLevelValues = Object.values(logLevelsMap);
export type LogLevel = (typeof logLevelValues)[number];
export * from './type-guards';

