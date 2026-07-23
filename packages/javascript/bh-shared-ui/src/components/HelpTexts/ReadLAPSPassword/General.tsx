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
                {groupSpecialFormat(sourceType, sourceName)} 读取计算机上由本地管理员密码解决方案 (LAPS) 设置的密码的能力 {targetName}.
            </Typography>
            <Typography variant='body2'>
                对于使用旧版 LAPS 的系统，以下 AD 计算机对象属性是相关的：
                <br />
                <b>- ms-Mcs-AdmPwd</b>: 明文 LAPS 密码
                <br />
                <b>- ms-Mcs-AdmPwdExpirationTime</b>: LAPS 密码过期时间
                <br />
            </Typography>
            <Typography variant='body2'>
                对于使用 Windows LAPS (2023 版) 的系统，以下 AD 计算机对象属性是相关的：
                <br />
                <b>- msLAPS-Password</b>: 明文 LAPS 密码
                <br />
                <b>- msLAPS-PasswordExpirationTime</b>: LAPS 密码过期时间
                <br />
                <b>- msLAPS-EncryptedPassword</b>: 加密的 LAPS 密码
                <br />
                <b>- msLAPS-EncryptedPasswordHistory</b>: 加密的 LAPS 密码 history
                <br />
                <b>- msLAPS-EncryptedDSRMPassword</b>: 加密的目录服务还原模式 (DSRM) 密码
                <br />
                <b>- msLAPS-EncryptedDSRMPasswordHistory</b>: 加密的 DSRM 密码历史
                <br />
            </Typography>
        </>
    );
};

export default General;
