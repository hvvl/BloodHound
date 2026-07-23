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
                使用 PowerView 函数时，请记住 PowerShell v5 引入了多种安全机制，使防御者更容易看到 PowerShell 在其环境中的活动。
                network, such as script block logging and AMSI. You can bypass those security mechanisms by downgrading
                to PowerShell v2, which all PowerView functions support.
            </Typography>
            <Typography variant='body2'>
                Modifying permissions on an object will generate 4670 and 4662 events on the domain controller that
                handled the request.
            </Typography>
            <Typography variant='body2'>
                其他 OPSEC 考量取决于目标对象以及如何利用此权限。. Opsec considerations for each abuse primitive are documented on the specific abuse edges and
                on the BloodHound wiki.
            </Typography>
        </>
    );
};

export default Opsec;
