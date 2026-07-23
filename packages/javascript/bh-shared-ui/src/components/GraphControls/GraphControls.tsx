// Copyright 2025 Specter Ops, Inc.
//
// Licensed under the Apache License, Version 2.0
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

import { faCropAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MenuItem, Popper } from '@mui/material';
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'doodle-ui';
import capitalize from 'lodash/capitalize';
import isEmpty from 'lodash/isEmpty';
import { useRef, useState } from 'react';
import { useExploreParams, useKeybindings } from '../../hooks';
import { cn } from '../../utils';
import { exportToJson } from '../../utils/exportGraphData';
import GraphButton from '../GraphButton';
import GraphMenu from '../GraphMenu';
import SearchCurrentNodes, { FlatNode } from '../SearchCurrentNodes';

interface GraphControlsProps<T extends readonly string[]> {
    onReset: () => void;
    onLayoutChange: (layout: T[number]) => void;
    onToggleNodeLabels: () => void;
    onToggleEdgeLabels: () => void;
    onSearchedNodeClick: (node: FlatNode) => void;
    isExploreTableSelected?: boolean;
    isExploreLayoutSelected?: boolean;
    layoutOptions: T;
    selectedLayout?: T[number];
    showNodeLabels: boolean;
    showEdgeLabels: boolean;
    jsonData: Record<string, any> | undefined;
    currentNodes: Record<string, any> | undefined;
}

function GraphControls<T extends readonly string[]>(props: GraphControlsProps<T>) {
    const {
        onReset,
        onLayoutChange,
        onToggleNodeLabels,
        onToggleEdgeLabels,
        onSearchedNodeClick,
        isExploreTableSelected,
        isExploreLayoutSelected,
        layoutOptions,
        selectedLayout,
        showNodeLabels,
        showEdgeLabels,
        jsonData,
        currentNodes = {},
    } = props;
    const { searchType } = useExploreParams();
    const [isCurrentSearchOpen, setIsCurrentSearchOpen] = useState(false);

    const currentSearchAnchorElement = useRef(null);
    useKeybindings({
        shift: {
            Slash: () => {
                setIsCurrentSearchOpen(!isCurrentSearchOpen);
            },
        },
        KeyG: onReset,
    });

    const handleToggleAllLabels = () => {
        if (showNodeLabels && showEdgeLabels) {
            // Hide All
            onToggleNodeLabels();
            onToggleEdgeLabels();
        } else {
            // Show All
            if (!showNodeLabels) onToggleNodeLabels();
            if (!showEdgeLabels) onToggleEdgeLabels();
        }
    };

    return (
        <>
            <div
                data-testid='explore_graph-controls'
                className='flex gap-1 pointer-events-auto'
                ref={currentSearchAnchorElement}>
                <TooltipProvider>
                    <TooltipRoot>
                        <TooltipTrigger className='pointer-events-auto'>
                            {/* tooltip won't show without this wrapper div for some reason */}
                            <div>
                                <GraphButton
                                    aria-label='重置图形'
                                    onClick={onReset}
                                    displayText={<FontAwesomeIcon aria-label='reset graph view' icon={faCropAlt} />}
                                    data-testid='explore_graph-controls_reset-button'
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipPortal>
                            <TooltipContent className='dark:bg-neutral-dark-5 border-0'>
                                <span>重置图形</span>
                            </TooltipContent>
                        </TooltipPortal>
                    </TooltipRoot>
                </TooltipProvider>

                <GraphMenu label={`${!showNodeLabels || !showEdgeLabels ? '显示' : '隐藏'}标签`}>
                    <MenuItem
                        aria-label={`${!showEdgeLabels ? 'Show' : 'Hide'} All Labels Toggle`}
                        data-testid='explore_graph-controls_all-labels-toggle'
                        onClick={handleToggleAllLabels}>
                        {!showNodeLabels || !showEdgeLabels ? '显示' : '隐藏'}全部标签
                    </MenuItem>
                    <MenuItem
                        aria-label={`${showNodeLabels ? 'Hide' : 'Show'} Node Labels Toggle`}
                        data-testid='explore_graph-controls_node-labels-toggle'
                        onClick={onToggleNodeLabels}>
                        {showNodeLabels ? '隐藏' : '显示'}节点标签
                    </MenuItem>
                    <MenuItem
                        aria-label={`${showEdgeLabels ? 'Hide' : 'Show'} Edge Labels Toggle`}
                        data-testid='explore_graph-controls_edge-labels-toggle'
                        onClick={onToggleEdgeLabels}>
                        {showEdgeLabels ? '隐藏' : '显示'} Edge 标签
                    </MenuItem>
                </GraphMenu>

                <GraphMenu label='布局'>
                    {layoutOptions.map((buttonLabel) => {
                        const tableViewIsSelected = isExploreTableSelected && searchType === 'cypher';
                        const isSelected = tableViewIsSelected
                            ? buttonLabel === 'table' && isExploreLayoutSelected
                            : buttonLabel === selectedLayout && isExploreLayoutSelected;

                        return (
                            <MenuItem
                                data-testid={`explore_graph-controls_${buttonLabel}-buttonLabel`}
                                key={buttonLabel}
                                selected={isSelected}
                                onClick={() => onLayoutChange(buttonLabel)}
                                className={cn({ '!bg-primary text-white dark:text-[#121212]': isSelected })}>
                                {capitalize(buttonLabel)}
                            </MenuItem>
                        );
                    })}
                </GraphMenu>

                <GraphMenu label='导出'>
                    <MenuItem onClick={() => exportToJson(jsonData)} disabled={isEmpty(jsonData)}>
                        JSON
                    </MenuItem>
                </GraphMenu>

                <GraphButton
                    aria-label='在结果中搜索节点'
                    onClick={() => setIsCurrentSearchOpen(true)}
                    displayText={'搜索'}
                    disabled={isCurrentSearchOpen}
                    data-testid='explore_graph-controls_search-current-results'
                />
            </div>
            <Popper
                open={isCurrentSearchOpen}
                anchorEl={currentSearchAnchorElement.current}
                placement='top'
                disablePortal
                aria-label='Search Current Nodes'
                className='w-[90%] z-[1]'>
                <div className='pointer-events-auto' data-testid='explore_graph-controls_search-current-nodes-popper'>
                    <SearchCurrentNodes
                        className='p-2 mb-2'
                        currentNodes={currentNodes}
                        onSelect={(node) => {
                            onSearchedNodeClick(node);
                            setIsCurrentSearchOpen(false);
                        }}
                        onClose={() => setIsCurrentSearchOpen(false)}
                    />
                </div>
            </Popper>
        </>
    );
}

export default GraphControls;
