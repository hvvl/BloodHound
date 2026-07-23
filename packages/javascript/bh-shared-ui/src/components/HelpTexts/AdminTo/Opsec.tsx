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

import { Typography } from 'doodle-ui';
import { FC } from 'react';

const Opsec: FC = () => {
    return (
        <>
            <Typography variant='body2'>
                上述技术会产生多种取证痕迹。例如，通过 PsExec 进行横向移动将在目标系统上生成 4697 事件。如果目标组织正在收集和分析这些事件，他们可能会很容易检测到通过 PsExec 进行的横向移动。
            </Typography>

            <Typography variant='body2'>
                此外，EDR 产品可能会检测到您注入 lsass 的尝试并通知 SOC 分析师。
                are many more opsec considerations to keep in mind when abusing administrator privileges. For more
                information, see the References tab.
            </Typography>
        </>
    );
};

export default Opsec;
