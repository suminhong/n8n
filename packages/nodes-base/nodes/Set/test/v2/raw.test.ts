import { mock } from 'jest-mock-extended';
import { get } from 'lodash';
import { constructExecutionMetaData } from 'n8n-core';
import {
	ApplicationError,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IGetNodeParameterOptions,
	type INode,
} from 'n8n-workflow';

import { type SetNodeOptions } from '../../v2/helpers/interfaces';
import * as utils from '../../v2/helpers/utils';
import { execute } from '../../v2/raw.mode';

export const node: INode = {
	id: '11',
	name: 'Set Node',
	type: 'n8n-nodes-base.set',
	typeVersion: 3,
	position: [42, 42],
	parameters: {
		mode: 'manual',
		fields: {
			values: [],
		},
		include: 'none',
		options: {},
	},
};

export const createMockExecuteFunction = (
	nodeParameters: IDataObject,
	continueOnFail: boolean = false,
) => {
	const fakeExecuteFunction = {
		getNodeParameter(
			parameterName: string,
			_itemIndex: number,
			fallbackValue?: IDataObject | undefined,
			options?: IGetNodeParameterOptions | undefined,
		) {
			const parameter = options?.extractValue ? `${parameterName}.value` : parameterName;
			return get(nodeParameters, parameter, fallbackValue);
		},
		getNode() {
			return node;
		},
		helpers: { constructExecutionMetaData },
		continueOnFail: () => continueOnFail,
	} as unknown as IExecuteFunctions;
	return fakeExecuteFunction;
};

describe('test Set2, rawMode', () => {
	afterEach(() => jest.resetAllMocks());

	it('should call parseJsonParameter if rawData.jsonOutput is undefined', async () => {
		const fakeExecuteFunction = createMockExecuteFunction({ jsonOutput: 'jsonData' });

		const item = {
			json: {
				input1: 'value1',
				input2: 2,
				input3: [1, 2, 3],
			},
			pairedItem: {
				item: 0,
				input: undefined,
			},
		};

		const options: SetNodeOptions = {
			include: 'none',
		};

		const rawData = {
			num1: 55,
			str1: '42',
			arr1: ['foo', 'bar'],
			obj: {
				key: 'value',
			},
		};

		jest.spyOn(utils, 'parseJsonParameter').mockReturnValue({});
		jest.spyOn(utils, 'composeReturnItem').mockReturnValue(mock());

		await execute.call(fakeExecuteFunction, item, 0, options, rawData, node);

		expect(utils.parseJsonParameter).toHaveBeenCalledWith('jsonData', node, 0);
		expect(utils.composeReturnItem).toHaveBeenCalledWith(0, item, {}, options, 3);
	});

	it('should call parseJsonParameter with resolveRawData if rawData.jsonOutput is undefined', async () => {
		const fakeExecuteFunction = createMockExecuteFunction({ jsonOutput: 'jsonData' });

		const item = {
			json: {
				input1: 'value1',
				input2: 2,
				input3: [1, 2, 3],
			},
			pairedItem: {
				item: 0,
				input: undefined,
			},
		};

		const options: SetNodeOptions = {
			include: 'none',
		};

		const rawData = {
			num1: 55,
			str1: '42',
			arr1: ['foo', 'bar'],
			obj: {
				key: 'value',
			},
			jsonOutput: 'jsonOutput',
		};

		jest.spyOn(utils, 'parseJsonParameter').mockReturnValue({});
		jest.spyOn(utils, 'composeReturnItem').mockReturnValue(mock());
		jest.spyOn(utils, 'resolveRawData').mockReturnValue('resolvedData');

		await execute.call(fakeExecuteFunction, item, 0, options, rawData, node);

		expect(utils.parseJsonParameter).toHaveBeenCalledWith('resolvedData', node, 0);
		expect(utils.composeReturnItem).toHaveBeenCalledWith(0, item, {}, options, 3);
	});

	it('should return json when continue on fail', async () => {
		const fakeExecuteFunction = createMockExecuteFunction({ jsonOutput: 'jsonData' }, true);

		const item = {
			json: {
				input1: 'value1',
				input2: 2,
				input3: [1, 2, 3],
			},
			pairedItem: {
				item: 0,
				input: undefined,
			},
		};

		const options: SetNodeOptions = {
			include: 'none',
		};

		const rawData = {
			num1: 55,
			str1: '42',
			arr1: ['foo', 'bar'],
			obj: {
				key: 'value',
			},
			jsonOutput: 'jsonOutput',
		};

		jest.spyOn(utils, 'parseJsonParameter').mockImplementation(() => {
			throw new ApplicationError('Error');
		});

		const output = await execute.call(fakeExecuteFunction, item, 0, options, rawData, node);

		expect(output).toEqual({ json: { error: 'Error' }, pairedItem: { item: 0 } });
	});

	it('should throw a NodeOperationError when continue on fail is false', async () => {
		const fakeExecuteFunction = createMockExecuteFunction({ jsonOutput: 'jsonData' });

		const item = {
			json: {
				input1: 'value1',
				input2: 2,
				input3: [1, 2, 3],
			},
			pairedItem: {
				item: 0,
				input: undefined,
			},
		};

		const options: SetNodeOptions = {
			include: 'none',
		};

		const rawData = {
			num1: 55,
			str1: '42',
			arr1: ['foo', 'bar'],
			obj: {
				key: 'value',
			},
			jsonOutput: 'jsonOutput',
		};

		jest.spyOn(utils, 'parseJsonParameter').mockImplementation(() => {
			throw new NodeOperationError(mock(), 'Node Operation Error');
		});

		await expect(
			execute.call(fakeExecuteFunction, item, 0, options, rawData, node),
		).rejects.toThrow(NodeOperationError);
	});
});
