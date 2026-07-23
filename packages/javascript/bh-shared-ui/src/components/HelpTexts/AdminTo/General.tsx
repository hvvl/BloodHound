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
import { EdgeInfoProps } from '../index';
import { groupSpecialFormat } from '../utils';

const General: FC<EdgeInfoProps> = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <Typography variant='body2'>
                {groupSpecialFormat(sourceType, sourceName)} 对计算机的管理员权限 {targetName}.
            </Typography>

            <Typography variant='body2'>
                默认情况下，管理员有多种方式在 Windows 系统上执行远程代码，包括通过 RDP、WMI、WinRM、服务控制管理器和远程 DCOM 执行。
            </Typography>

            <Typography variant='body2'>
                此外，管理员有多种选项来模拟登录到系统的其他用户，包括提取明文密码、令牌模拟以及注入到以其他用户身份运行的进程中。
            </Typography>

            <Typography variant='body2'>
                最后，管理员通常可以禁用基于主机的安全控制，这些控制本来会阻止上述技术。
            </Typography>
        </>
    );
};

export default General;
