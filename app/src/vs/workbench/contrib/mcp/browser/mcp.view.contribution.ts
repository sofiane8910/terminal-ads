/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { McpServersViewsContribution } from './mcpServersView.js';
import { ONEPILOT_HIDE_AI } from '../../../../base/common/onepilot.js';

// Onepilot fork: MCP (Model Context Protocol) is AI-agent infrastructure — hide its servers view.
// MCP services (registered in mcp.contribution) stay registered; the view is unreachable. docs/strip.
if (!ONEPILOT_HIDE_AI) {
	registerWorkbenchContribution2(McpServersViewsContribution.ID, McpServersViewsContribution, WorkbenchPhase.AfterRestored);
}
