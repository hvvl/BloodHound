// Copyright 2023 Specter Ops, Inc.
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

import { Alert, Box, Link, Paper, Skeleton } from '@mui/material';
import { CollectorCardList, DocumentationLinks, PageWithTitle, apiClient, useFeatureFlag } from 'bh-shared-ui';
import { Typography } from 'doodle-ui';
import { CommunityCollectorType } from 'js-client-library';
import fileDownload from 'js-file-download';
import { addSnackbar } from 'src/ducks/global/actions';
import { useGetCollectorsByType } from 'src/hooks/useCollectors';
import { useAppDispatch } from 'src/store';

const DownloadCollectors = () => {
    /* Hooks */
    const dispatch = useAppDispatch();
    const sharpHoundCollectorsQuery = useGetCollectorsByType('sharphound');
    const azureHoundCollectorsQuery = useGetCollectorsByType('azurehound');
    const { data: openHoundEnabled } = useFeatureFlag('openhound_support');

    const openHoundHref = 'https://hub.docker.com/r/specterops/openhound';

    /* Event Handlers */
    const downloadCollector = (collectorType: CommunityCollectorType, version: string) => {
        apiClient
            .downloadCollector(collectorType, version)
            .then((res) => {
                const filename =
                    res.headers['content-disposition']?.match(/^.*filename="(.*)"$/)?.[1] ||
                    `${collectorType}-${version}.zip`;
                fileDownload(res.data, filename);
            })
            .catch((err) => {
                console.error(err);
                dispatch(
                    addSnackbar('文件下载失败，请重试。', 'downloadCollectorFailure', {
                        autoHideDuration: null,
                    })
                );
            });
    };

    const downloadCollectorChecksum = (collectorType: CommunityCollectorType, version: string) => {
        apiClient
            .downloadCollectorChecksum(collectorType, version)
            .then((res) => {
                const filename =
                    res.headers['content-disposition']?.match(/^.*filename="(.*)"$/)?.[1] ||
                    `${collectorType}-${version}.zip.sha256`;
                fileDownload(res.data, filename);
            })
            .catch((err) => {
                console.error(err);
                dispatch(
                    addSnackbar(
                        '文件下载失败，请重试。',
                        'downloadCollectorChecksumFailure',
                        { autoHideDuration: null }
                    )
                );
            });
    };

    /* Implementation */
    return (
        <PageWithTitle
            title='下载采集器'
            data-testid='download-collectors'
            pageDescription={
                openHoundEnabled?.enabled ? (
                    <Typography variant='body2'>
                        首先，使用 SharpHound、AzureHound 或 OpenHound 采集数据。
                        <br />
                        BloodHound CE 支持 {DocumentationLinks.sharpHoundCELink}、{' '}
                        {DocumentationLinks.azureHoundCELink} 和{' '}
                        <Link target='_blank' data-testid='download-collectors-openhound-link' href={openHoundHref}>
                            OpenHound
                        </Link>
                        。
                    </Typography>
                ) : (
                    <Typography variant='body2'>
                        首先，使用 SharpHound 或 AzureHound 采集数据。
                        <br />
                        BloodHound CE 同时支持 {DocumentationLinks.sharpHoundCELink} 和{' '}
                        {DocumentationLinks.azureHoundCELink} 采集器。
                    </Typography>
                )
            }>
            <div className='grid gap-8 py-4'>
                {(sharpHoundCollectorsQuery.isError ||
                    azureHoundCollectorsQuery.isError ||
                    sharpHoundCollectorsQuery.data?.data.versions.length === 0) && (
                    <Alert severity='warning'>
                        浏览器扩展（如广告拦截器或其他隐私扩展）可能会阻止此页面上的下载链接显示。请暂停或禁用浏览器扩展，然后刷新此页面。
                    </Alert>
                )}
                <Box>
                    <Typography variant='h2'>SharpHound</Typography>
                    {sharpHoundCollectorsQuery.isLoading ? (
                        <Paper>
                            <Box p={2}>
                                <Typography variant='h6' component='div'>
                                    <Skeleton variant='text' />
                                </Typography>
                                <Typography variant='body1'>
                                    <Skeleton variant='text' />
                                </Typography>
                            </Box>
                        </Paper>
                    ) : sharpHoundCollectorsQuery.isError ||
                      sharpHoundCollectorsQuery.data?.data.versions.length === 0 ? (
                        <Typography variant='body1'>
                            当前没有可用的 SharpHound 版本可供下载
                        </Typography>
                    ) : (
                        <CollectorCardList
                            collectors={sharpHoundCollectorsQuery
                                .data!.data.versions.map((collector) => ({
                                    collectorType: 'sharphound' as const,
                                    version: collector.version,
                                    checksum: collector.sha256sum,
                                    isLatest: collector.version === sharpHoundCollectorsQuery.data!.data.latest,
                                    isDeprecated: collector.deprecated,
                                    onClickDownload: downloadCollector,
                                    onClickDownloadChecksum: downloadCollectorChecksum,
                                }))
                                .sort((a, b) => b.version.localeCompare(a.version))}
                        />
                    )}
                </Box>
                <Box>
                    <Typography variant='h2'>AzureHound</Typography>
                    {azureHoundCollectorsQuery.isLoading ? (
                        <Paper>
                            <Box p={2}>
                                <Typography variant='h6' component='div'>
                                    <Skeleton variant='text' />
                                </Typography>
                                <Typography variant='body1'>
                                    <Skeleton variant='text' />
                                </Typography>
                            </Box>
                        </Paper>
                    ) : azureHoundCollectorsQuery.isError ||
                      azureHoundCollectorsQuery.data!.data.versions.length === 0 ? (
                        <Typography variant='body1'>
                            当前没有可用的 AzureHound 版本可供下载
                        </Typography>
                    ) : (
                        <CollectorCardList
                            collectors={azureHoundCollectorsQuery
                                .data!.data.versions.map((collector) => ({
                                    collectorType: 'azurehound' as const,
                                    version: collector.version,
                                    checksum: collector.sha256sum,
                                    isLatest: collector.version === azureHoundCollectorsQuery.data!.data.latest,
                                    isDeprecated: collector.deprecated,
                                    onClickDownload: downloadCollector,
                                    onClickDownloadChecksum: downloadCollectorChecksum,
                                }))
                                .sort((a, b) => b.version.localeCompare(a.version))}
                        />
                    )}
                </Box>
                {openHoundEnabled?.enabled && (
                    <Box>
                        <Typography variant='h2'>OpenHound</Typography>
                        <Paper>
                            <Box p={2}>
                                <Typography variant='body1'>
                                    <Link href={openHoundHref} target='_blank'>
                                        在 Docker Hub 上下载 OpenHound
                                    </Link>
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>
                )}
            </div>
        </PageWithTitle>
    );
};

export default DownloadCollectors;
