import { mock } from 'jest-mock-extended';
import set from 'lodash/set';
import {
	ApplicationError,
	type INode,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeTypeDescription,
} from 'n8n-workflow';

import { testWorkflows, getWorkflowFilenames } from '@test/nodes/Helpers';
import { ENABLE_LESS_STRICT_TYPE_VALIDATION } from '@utils/constants';

import * as IfV2 from '../../V2/IfV2.node';
import * as IfV2Utils from '../../V2/utils';

jest.mock('lodash/set', () => jest.fn());

describe('Test IF v2 Node Tests', () => {
	afterEach(() => jest.resetAllMocks());

	describe('Test IF v2 Node Workflow Tests', () => testWorkflows(getWorkflowFilenames(__dirname)));

	describe('Test IF V2 Node Unit Tests', () => {
		const baseDescriptionMock = mock<INodeTypeDescription>();
		const node = new IfV2.IfV2(baseDescriptionMock);
		const thisArg = mock<IExecuteFunctions>({});

		it('should return false items if continue on fail is true', async () => {
			thisArg.getInputData.mockReturnValue([{ json: {} }]);
			thisArg.continueOnFail.mockReturnValue(true);

			jest.spyOn(IfV2, 'getOptions').mockImplementation(() => {
				throw new ApplicationError('Error');
			});

			const output = await node.execute.call(thisArg);
			expect(output).toEqual([[], [{ json: {} }]]);
		});

		it('should throw an error if a NodeOperationError is thrown', async () => {
			thisArg.getInputData.mockReturnValue([{ json: {} }]);

			jest.spyOn(IfV2, 'getOptions').mockImplementation(() => {
				throw new NodeOperationError(mock(), 'Node Operation Error');
			});

			await expect(node.execute.call(thisArg)).rejects.toThrow(NodeOperationError);
		});

		it('should throw an error if a ApplicationError  is thrown and set the context of the error', async () => {
			thisArg.getInputData.mockReturnValue([{ json: {} }]);

			const error = new ApplicationError('Error');

			jest.spyOn(IfV2, 'getOptions').mockImplementation(() => {
				throw error;
			});

			await expect(node.execute.call(thisArg)).rejects.toThrow(ApplicationError);
			expect(set).toHaveBeenCalledWith(error, 'context.itemIndex', 0);
		});

		it('should throw a NodeOperationError error if the error is not NodeOperationError of Application Error', async () => {
			thisArg.getInputData.mockReturnValue([{ json: {} }]);

			const error = new Error('Error');

			jest.spyOn(IfV2, 'getOptions').mockImplementation(() => {
				throw error;
			});

			await expect(node.execute.call(thisArg)).rejects.toThrow(NodeOperationError);
		});

		it('should throw a NodeOperationError and set description of error if error thrown while getting conditions and if error description is not set', async () => {
			const error = new Error();
			const mockNode = mock<INode>();

			thisArg.getInputData.mockReturnValue([{ json: {} }]);
			thisArg.getNodeParameter
				.calledWith('options', 0)
				.mockReturnValue({ looseTypeValidation: false });
			thisArg.getNode.calledWith().mockReturnValue(mockNode);

			jest.spyOn(IfV2, 'getConditions').mockImplementation(() => {
				throw error;
			});

			jest.spyOn(IfV2Utils, 'getTypeValidationParameter').mockReturnValue(() => false);

			await expect(node.execute.call(thisArg)).rejects.toThrow(NodeOperationError);

			expect(set).toHaveBeenCalledWith(error, 'description', ENABLE_LESS_STRICT_TYPE_VALIDATION);
			expect(set).toHaveBeenCalledWith(error, 'context.itemIndex', 0);
			expect(set).toHaveBeenCalledWith(error, 'node', mockNode);
		});

		it('should assign a paired item if paired item is undefined', async () => {
			const mockNode = mock<INode>();

			thisArg.getInputData.mockReturnValue([{ json: {} }]);
			thisArg.getNodeParameter
				.calledWith('options', 0)
				.mockReturnValue({ looseTypeValidation: false });
			thisArg.getNodeParameter
				.calledWith('condition', 0, false, { extractValue: true })
				.mockReturnValue('false');
			thisArg.getNode.calledWith().mockReturnValue(mockNode);

			jest.spyOn(IfV2Utils, 'getTypeValidationParameter').mockReturnValue(() => false);

			const output = await node.execute.call(thisArg);
			expect(output).toEqual([[], [{ json: {}, pairedItem: { item: 0 } }]]);
		});
	});

	describe('Test IF V2 Node Util Tests', () => {
		const thisArg = mock<IExecuteFunctions>({});

		it('should return an option if the node type version is less than the version passed in', () => {
			const mockNode = mock<INode>({ typeVersion: 2.0 });
			thisArg.getNode.calledWith().mockReturnValue(mockNode);

			const output = IfV2Utils.getTypeValidationParameter(2.1)(thisArg, 0, true);
			expect(output).toBe(true);
		});

		it('should return an looseTypeValidation if the node type version is greater than the version passed in', () => {
			const looseTypeValidation = true;
			const mockNodeGreaterThan = mock<INode>({ typeVersion: 2.2 });

			thisArg.getNode.calledWith().mockReturnValue(mockNodeGreaterThan);
			thisArg.getNodeParameter
				.calledWith('looseTypeValidation', 0, false)
				.mockReturnValue(looseTypeValidation);

			const output = IfV2Utils.getTypeValidationParameter(2.1)(thisArg, 0, true);
			expect(output).toBe(looseTypeValidation);
		});

		it('should return an looseTypeValidation if the node type version is equal than the version passed in', () => {
			const looseTypeValidation = true;
			const mockNodeGreaterThan = mock<INode>({ typeVersion: 2.1 });

			thisArg.getNode.calledWith().mockReturnValue(mockNodeGreaterThan);
			thisArg.getNodeParameter
				.calledWith('looseTypeValidation', 0, false)
				.mockReturnValue(looseTypeValidation);

			const output = IfV2Utils.getTypeValidationParameter(2.1)(thisArg, 0, true);
			expect(output).toBe(looseTypeValidation);
		});
	});
});
