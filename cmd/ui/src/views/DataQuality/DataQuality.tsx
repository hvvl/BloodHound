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

import { Alert, AlertTitle, Box, Grid, Link } from '@mui/material';
import {
    getStatsComponent,
    LoadingOverlay,
    PageWithTitle,
    SelectedEnvironment,
    SimpleEnvironmentSelector,
    useInitialEnvironment,
} from 'bh-shared-ui';
import { Typography } from 'doodle-ui';
import { useEffect, useState } from 'react';
import { dataCollectionMessage } from './utils';

const DataQuality: React.FC = () => {
    const { data: initialEnvironment, isLoading } = useInitialEnvironment({ orderBy: 'name' });

    const [selectedEnvironment, setSelectedEnvironment] = useState<SelectedEnvironment | null>(
        initialEnvironment ?? null
    );

    const environment = selectedEnvironment ?? initialEnvironment;
    const noIdSetForEnvironment =
        !environment?.id && (environment?.type === 'active-directory' || environment?.type === 'azure');

    const handleSelect: (environment: SelectedEnvironment) => void = (selection) => setSelectedEnvironment(selection);

    const [dataError, setDataError] = useState(false);

    useEffect(() => {
        initialEnvironment && setSelectedEnvironment(initialEnvironment);
    }, [initialEnvironment]);

    useEffect(() => {
        setDataError(false);
    }, [environment]);

    const dataErrorHandler = () => {
        setDataError(true);
    };

    const environmentErrorMessage = <>环境不可用。{dataCollectionMessage}</>;

    if (isLoading) {
        return (
            <PageWithTitle
                title='数据质量'
                data-testid='data-quality'
                pageDescription={
                    <>
                        <QualityAssuranceDescription />
                        <LoadingOverlay loading />
                    </>
                }
            />
        );
    }

    if (!environment?.type || noIdSetForEnvironment) {
        return (
            <PageWithTitle
                title='数据质量'
                data-testid='data-quality'
                pageDescription={<QualityAssuranceDescription />}>
                <Box display='flex' justifyContent='flex-end' alignItems='center' minHeight='24px' mb={2}>
                    <SimpleEnvironmentSelector
                        align='end'
                        selected={{
                            type: environment?.type ?? null,
                            id: environment?.id ?? null,
                            environment_kind_id: environment?.environment_kind_id ?? null,
                        }}
                        errorMessage={environmentErrorMessage}
                        onSelect={handleSelect}
                    />
                </Box>
                <Alert severity='info'>
                    <AlertTitle>未选择域名或租户</AlertTitle>
                    请选择一个域名或租户以查看数据。如果无法选择域名，您可能需要先执行数据采集。{dataCollectionMessage}
                </Alert>
            </PageWithTitle>
        );
    }

    return (
        <PageWithTitle
            title='数据质量'
            data-testid='data-quality'
            pageDescription={<QualityAssuranceDescription />}>
            <Box display='flex' justifyContent='flex-end' alignItems='center' minHeight='24px' mb={2}>
                <SimpleEnvironmentSelector
                    align='end'
                    selected={{
                        type: selectedEnvironment?.type ?? null,
                        id: selectedEnvironment?.id ?? null,
                        environment_kind_id: environment?.environment_kind_id ?? null,
                    }}
                    errorMessage={environmentErrorMessage}
                    onSelect={handleSelect}
                />
            </Box>
            {dataError && (
                <Box paddingBottom={2}>
                    <Alert severity='warning'>
                        <AlertTitle>数据质量警告</AlertTitle>
                        数据似乎不完整或尚未采集。请查看{' '}
                        <Link
                            target='_blank'
                            href={'https://bloodhound.specterops.io/collect-data/overview#bloodhound-ce-collection'}>
                            数据采集
                        </Link>{' '}
                        页面了解如何开始数据采集。
                    </Alert>
                </Box>
            )}
            <Grid container spacing={2}>
                <Grid item xs={12} data-testid='data-quality_statistics'>
                    {getStatsComponent(environment, dataErrorHandler)}
                </Grid>
            </Grid>
        </PageWithTitle>
    );
};

export default DataQuality;

const QualityAssuranceDescription = () => (
    <Typography variant='body2'>
        了解 BloodHound 中采集的数据，按环境和主体类型分类展示。
    </Typography>
);
