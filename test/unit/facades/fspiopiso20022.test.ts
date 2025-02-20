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

import { IsoSource, IsoFacadeFunction, Target } from '../../../src/types';
import { TransformFacades } from '../../../src';
import * as createTransformerLib from '../../../src/lib/createTransformer';
import { fspiopIso20022Sources, mockLogger, expectedFspiopTargets } from '../../fixtures';
import { FSPIO20022PMappings } from '../../../src/mappings';
import { getProp, setProp } from 'src/lib/utils';

const { FSPIOPISO20022: FspiopIso20022TransformFacade } = TransformFacades;

const fspiopTargets = expectedFspiopTargets;

describe('FSPIOPISO20022TransformFacade tests', () => {
  const testCase = (source: IsoSource, transformerFn: IsoFacadeFunction, expectedTarget: Partial<Target> | null = null) => {
    return async () => {
      const target = await transformerFn(source, {});
      expect(target).toHaveProperty('body');
      if (expectedTarget !== null) expect(target).toEqual(expectedTarget);
    };
  }

  describe('configure', () => {
    it('should throw if invalid logger is provided', () => {
      const logger = {};
      expect(() => FspiopIso20022TransformFacade.configure({ logger } as any)).toThrow('Invalid logger provided');
    });
    it('should configure logger', async () => {
      const logger = mockLogger;
      FspiopIso20022TransformFacade.configure({ logger });
      vi.spyOn(createTransformerLib, 'createTransformer').mockImplementationOnce(() => {
        throw new Error('Test error')
      });
      const promise = FspiopIso20022TransformFacade.parties.put(fspiopIso20022Sources.parties.put);
      await expect(promise).rejects.toThrow();
      expect(logger.error).toBeCalled();
    });
  });
  describe('Parties', () => {
    describe('PUT /parties', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.parties.put };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.parties.put(source);
        await expect(promise).rejects.toThrow('Invalid source object for put parties');
      });
      it('should transform PUT parties payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.parties.put, FspiopIso20022TransformFacade.parties.put, fspiopTargets.parties.put)();
      });
    });
    describe('PUT /parties/{ID}/error', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.parties.put };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.parties.putError(source);
        await expect(promise).rejects.toThrow('Invalid source object for put parties error');
      });
      it('should transform PUT parties error payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.parties.putError, FspiopIso20022TransformFacade.parties.putError, fspiopTargets.parties.putError)();
      });
    });
  });
  describe('Quotes', () => {
    describe('POST /quotes', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.quotes.post };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.quotes.post(source);
        await expect(promise).rejects.toThrow('Invalid source object for post quotes');
      });
      it('should transform POST quotes payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.quotes.post, FspiopIso20022TransformFacade.quotes.post, fspiopTargets.quotes.post)();
      });
      it('should not apply mutation on target if override mapping is set', async () => {
        const source = { ...fspiopIso20022Sources.quotes.post };
        const overrideMapping = FSPIO20022PMappings.quotes.post;
        const target = await FspiopIso20022TransformFacade.quotes.post(source, { overrideMapping });
        expect(target).toHaveProperty('body');
        expect(getProp(target, 'body.amountType')).toBeUndefined();
      });
      it('should transform POST quotes payload from FSPIOP ISO 20022 to FSPIOP with body.CdtTrfTxInf.ChrgBr != DEBT', async () => {
        const source = { ...fspiopIso20022Sources.quotes.post };
        setProp(source, 'body.CdtTrfTxInf.ChrgBr', 'CRED');
        const target = await FspiopIso20022TransformFacade.quotes.post(source);
        expect(target).toHaveProperty('body');
        expect(getProp(target, 'body.amountType')).toBe('SEND');
      });
      it('should transform POST quotes payload from FSPIOP ISO 20022 to FSPIOP with refundInfo', async () => {
        const source = { ...fspiopIso20022Sources.quotes.post };
        setProp(source, 'body.CdtTrfTxInf.InstrForCdtrAgt.Cd', 'REFD');
        setProp(source, 'body.CdtTrfTxInf.InstrForCdtrAgt.InstrInf', 'Refund reason');

        const target = await FspiopIso20022TransformFacade.quotes.post(source);
        expect(target).toHaveProperty('body');
        expect(getProp(target, 'body.transactionType.refundInfo.reason')).toBe('Refund reason');
      });
      it('should transform POST quotes payload from FSPIOP ISO 20022 to FSPIOP with PAYER initiator', async () => {
        const source = { ...fspiopIso20022Sources.quotes.post };
        setProp(source, 'body.CdtTrfTxInf.PmtId.InstrId', undefined);

        const target = await FspiopIso20022TransformFacade.quotes.post(source);
        expect(target).toHaveProperty('body');
        expect(getProp(target, 'body.transactionType.initiator')).toBe('PAYER');
      });
      it('should transform POST quotes payload from FSPIOP ISO 20022 to FSPIOP with CONSUMER initiatorType', async () => {
        const source = { ...fspiopIso20022Sources.quotes.post };
        setProp(source, 'body.CdtTrfTxInf.PmtId.InstrId', undefined);
        setProp(source, 'body.CdtTrfTxInf.Dtr.Id.Pty', {});

        const target = await FspiopIso20022TransformFacade.quotes.post(source);
        expect(target).toHaveProperty('body');
        expect(getProp(target, 'body.transactionType.initiatorType')).toBe('CONSUMER');
      });
      it('should transform POST quotes payload from FSPIOP ISO 20022 to FSPIOP with CONSUMER initiatorType when CdtTrfTxInf.PmtId.InstrId is set', async () => {
        const source = { ...fspiopIso20022Sources.quotes.post };
        setProp(source, 'body.CdtTrfTxInf.PmtId.InstrId', {});
        setProp(source, 'body.CdtTrfTxInf.Cdr.Id.Pty', {});

        const target = await FspiopIso20022TransformFacade.quotes.post(source);
        expect(target).toHaveProperty('body');
        expect(getProp(target, 'body.transactionType.initiatorType')).toBe('CONSUMER');
      });
    });
    describe('PUT /quotes/{ID}', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.quotes.put };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.quotes.put(source);
        await expect(promise).rejects.toThrow('Invalid source object for put quotes');
      });
      it('should transform PUT quotes payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.quotes.put, FspiopIso20022TransformFacade.quotes.put, fspiopTargets.quotes.put)();
      });
    });
    describe('PUT /quotes/{ID}/error', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.quotes.putError };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.quotes.putError(source);
        await expect(promise).rejects.toThrow('Invalid source object for put quotes error');
      });
      it('should transform PUT quotes error payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.quotes.putError, FspiopIso20022TransformFacade.quotes.putError, fspiopTargets.quotes.putError)();
      });
    });
  });
  describe('Transfers', () => {
    describe('POST /transfers', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.transfers.post };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.transfers.post(source);
        await expect(promise).rejects.toThrow('Invalid source object for post transfers');
      });
      it('should transform POST transfers payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.transfers.post, FspiopIso20022TransformFacade.transfers.post, fspiopTargets.transfers.post)();
      });
    });
    describe('PATCH /transfers/{ID}', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.transfers.patch };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.transfers.patch(source);
        await expect(promise).rejects.toThrow('Invalid source object for patch transfers');
      });
      it('should transform PATCH transfers payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.transfers.patch, FspiopIso20022TransformFacade.transfers.patch, fspiopTargets.transfers.patch)();
      });
    });
    describe('PUT /transfers/{ID}', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.transfers.put };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.transfers.put(source);
        await expect(promise).rejects.toThrow('Invalid source object for put transfers');
      });
      it('should transform PUT transfers payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.transfers.put, FspiopIso20022TransformFacade.transfers.put, fspiopTargets.transfers.put)();
      });
    });
    describe('PUT /transfers/{ID}/error', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.transfers.post };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.transfers.putError(source);
        await expect(promise).rejects.toThrow('Invalid source object for put transfers error');
      });
      it('should transform PUT transfers error payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.transfers.putError, FspiopIso20022TransformFacade.transfers.putError, fspiopTargets.transfers.putError)();
      });
    });
  });
  describe('FXQuotes', () => {
    describe('POST /fxQuotes', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.fxQuotes.post };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.fxQuotes.post(source);
        await expect(promise).rejects.toThrow('Invalid source object for post fxQuotes');
      });
      it('should transform POST FX quotes payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.fxQuotes.post, FspiopIso20022TransformFacade.fxQuotes.post, fspiopTargets.fxQuotes.post)();
      });
    });
    describe('PUT /fxQuotes', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.fxQuotes.put };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.fxQuotes.put(source);
        await expect(promise).rejects.toThrow('Invalid source object for put fxQuotes');
      });
      it('should transform PUT FX quotes payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.fxQuotes.put, FspiopIso20022TransformFacade.fxQuotes.put, fspiopTargets.fxQuotes.put)();
      });
    });
    describe('PUT /fxQuotes/{ID}/error', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.fxQuotes.putError };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.fxQuotes.putError(source);
        await expect(promise).rejects.toThrow('Invalid source object for put fxQuotes error');
      });
      it('should transform PUT FX quotes error payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.fxQuotes.putError, FspiopIso20022TransformFacade.fxQuotes.putError, fspiopTargets.fxQuotes.putError)();
      });
    });
  });
  describe('FXTransfers', () => {
    describe('POST /fxTransfers', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.fxTransfers.post };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.fxTransfers.post(source);
        await expect(promise).rejects.toThrow('Invalid source object for post fxTransfers');
      });
      it('should transform POST FX transfers payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.fxTransfers.post, FspiopIso20022TransformFacade.fxTransfers.post, fspiopTargets.fxTransfers.post)();
      });
    });
    describe('PATCH /fxTransfers/{ID}', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.fxTransfers.patch };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.fxTransfers.patch(source);
        await expect(promise).rejects.toThrow('Invalid source object for patch fxTransfers');
      });
      it('should transform PATCH FX transfers payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.fxTransfers.patch, FspiopIso20022TransformFacade.fxTransfers.patch, fspiopTargets.fxTransfers.patch)();
      });
    });
    describe('PUT /fxTransfers/{ID}', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.fxTransfers.put };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.fxTransfers.put(source);
        await expect(promise).rejects.toThrow('Invalid source object for put fxTransfers');
      });
      it('should transform PUT FX transfers payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.fxTransfers.put, FspiopIso20022TransformFacade.fxTransfers.put, fspiopTargets.fxTransfers.put)();
      });
    });
    describe('PUT /fxTransfers/{ID}/error', () => {
      it('should throw if source is wrongly typed', async () => {
        const source = { ...fspiopIso20022Sources.fxTransfers.putError };
        setProp(source, 'body', undefined);
        const promise = FspiopIso20022TransformFacade.fxTransfers.putError(source);
        await expect(promise).rejects.toThrow('Invalid source object for put fxTransfers error');
      });
      it('should transform PUT FX transfers error payload from FSPIOP ISO 20022 to FSPIOP', async () => {
        await testCase(fspiopIso20022Sources.fxTransfers.putError, FspiopIso20022TransformFacade.fxTransfers.putError, fspiopTargets.fxTransfers.putError)();
      });
    });
  });
  describe('Extensions', () => {
    describe('Quotes extensions', () => {
      it('should roll up unmapped fields as extensions with facade option', async () => {
        const source = { ...fspiopIso20022Sources.quotes.post };
        setProp(source, 'body.CdtTrfTxInf.ExtraField1', 'ExtraValue1');
        const target = await FspiopIso20022TransformFacade.quotes.post(source, { rollUpUnmappedAsExtensions: true });
        expect(target).toHaveProperty('body');
        const ext = target.body.extensionList.extension.find((e: any) => e.key === 'CdtTrfTxInf.ExtraField1');
        expect(ext).toEqual({ key: 'CdtTrfTxInf.ExtraField1', value: 'ExtraValue1' });
      });
      it('should roll up unmapped fields as extensions with facade config', async () => {
        FspiopIso20022TransformFacade.configure({ rollUpUnmappedAsExtensions: true });
        const source = { ...fspiopIso20022Sources.quotes.post };
        setProp(source, 'body.CdtTrfTxInf.ExtraField1', 'ExtraValue1');
        const target = await FspiopIso20022TransformFacade.quotes.post(source, { rollUpUnmappedAsExtensions: true });
        expect(target).toHaveProperty('body');
        const ext = target.body.extensionList.extension.find((e: any) => e.key === 'CdtTrfTxInf.ExtraField1');
        expect(ext).toEqual({ key: 'CdtTrfTxInf.ExtraField1', value: 'ExtraValue1' });
        FspiopIso20022TransformFacade.configure({ rollUpUnmappedAsExtensions: false });
      });
    });
  });
});
