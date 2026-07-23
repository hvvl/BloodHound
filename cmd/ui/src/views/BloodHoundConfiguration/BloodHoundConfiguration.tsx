// Copyright 2024 Specter Ops, Inc.
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

import { AnalyzeNowConfiguration, CitrixRDPConfiguration, PageWithTitle } from 'bh-shared-ui';

const BloodHoundConfiguration = () => {
    return (
        <PageWithTitle
            title='BloodHound 配置'
            pageDescription={
                <p className='text-sm'>
                    修改您的 BloodHound 租户配置。请参阅我们的{' '}
                    <a
                        className='text-link underline'
                        href='https://bloodhound.specterops.io/analyze-data/bloodhound-gui/configuration'>
                        文档
                    </a>{' '}
                    了解各选项的详细信息。
                </p>
            }>
            <div className='flex flex-col gap-6 mt-4'>
                <AnalyzeNowConfiguration description='此操作将重新运行 BloodHound 环境中的分析，重新生成由复杂配置导致的所有攻击路径。' />
                <CitrixRDPConfiguration />
            </div>
        </PageWithTitle>
    );
};

export default BloodHoundConfiguration;
