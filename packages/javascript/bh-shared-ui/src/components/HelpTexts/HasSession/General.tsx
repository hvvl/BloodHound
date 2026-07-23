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

const General: FC<EdgeInfoProps> = ({ sourceName, targetName }) => {
    return (
        <>
            <Typography variant='body2'>
                用户 {targetName} 在计算机上有一个会话 {sourceName}.
            </Typography>
            <Typography variant='body2'>
                当用户认证到计算机时，他们通常会在系统上留下暴露的凭据，这些凭据可以通过 LSASS 注入、令牌操作/窃取或注入到用户进程中来获取。
            </Typography>
            <Typography variant='body2'>
                任何作为系统管理员的用户都有能力从内存中检索凭据材料（如果仍然存在的话）。
            </Typography>
            <Typography variant='body2'>
                注意：会话不保证凭据材料一定存在，只是可能存在。
            </Typography>
        </>
    );
};

export default General;
