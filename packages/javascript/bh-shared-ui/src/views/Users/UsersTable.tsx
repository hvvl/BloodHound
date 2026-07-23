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

import { faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from '@mui/material';
import { DateTime } from 'luxon';
import { FC } from 'react';
import { useQuery } from 'react-query';
import { DataTable, Header } from '../../components';
import { usePermissions, useTheme } from '../../hooks';
import { useBloodHoundUsers, useSelf } from '../../hooks/useBloodHoundUsers';
import { LuxonFormat, Permission, apiClient } from '../../utils';
import UserActionsMenu from './UserActionsMenu';

type UserStatus = '已删除' | '已禁用' | '正常';

const getUserStatusText = (user: any): UserStatus => {
    if (user.deleted_at.Valid) {
        return '已删除';
    } else if (user.is_disabled) {
        return '已禁用';
    } else return '正常';
};

type UsersTableProps = {
    onUpdateUser: (open: boolean) => void;
    onDisabledUser: (open: boolean) => void;
    onEnabledUser: (open: boolean) => void;
    onDeleteUser: (open: boolean) => void;
    onUpdateUserPassword: (open: boolean) => void;
    onExpiredUserPassword: (open: boolean) => void;
    onManageUserTokens: (open: boolean) => void;
    setDisable2FADialogOpen: (open: boolean) => void;
    setSelectedUserId: (userId: string | null) => void;
};

const UsersTable: FC<UsersTableProps> = ({
    onUpdateUser,
    onDisabledUser,
    onEnabledUser,
    onDeleteUser,
    onUpdateUserPassword,
    onExpiredUserPassword,
    onManageUserTokens,
    setDisable2FADialogOpen,
    setSelectedUserId,
}) => {
    const theme = useTheme();

    const usersTableHeaders: Header[] = [
        { label: '用户名' },
        { label: '邮箱' },
        { label: '姓名' },
        { label: '创建时间' },
        { label: '角色' },
        { label: '状态' },
        { label: '认证方式' },
        { label: '操作菜单', alignment: 'right' as const, srOnly: true },
    ];

    const getSelfQuery = useSelf();
    const listUsersQuery = useBloodHoundUsers();

    const { checkPermission } = usePermissions();
    const hasPermission = checkPermission(Permission.AUTH_MANAGE_USERS) || checkPermission(Permission.AUTH_READ_USERS);

    const listSSOProvidersQuery = useQuery(
        ['listSSOProviders'],
        ({ signal }) => apiClient.listSSOProviders({ signal }).then((res) => res.data?.data),
        { enabled: hasPermission }
    );

    const SSOProvidersMap =
        listSSOProvidersQuery.data?.reduce((acc: any, val: any) => {
            acc[val.id] = val;
            return acc;
        }, {}) || {};

    const getAuthMethodText = (user: any): JSX.Element => {
        if (user.sso_provider_id)
            return <span>{`SSO: ${SSOProvidersMap[user.sso_provider_id]?.name || user.sso_provider_id}`}</span>;
        if (user.AuthSecret?.totp_activated)
            return <span style={{ whiteSpace: 'pre-wrap' }}>{'用户名 / 密码\n已启用 MFA'}</span>;
        return <span>用户名 / 密码</span>;
    };

    const usersTableRows = listUsersQuery.data?.map((user, index) => {
        const isNonUniqueEmail = !!listUsersQuery.data?.find(
            ({ email_address, id }) =>
                user.email_address?.toLowerCase() === email_address?.toLowerCase() && user.id !== id
        );

        return [
            // This linting rule is disabled because the elements in this array do not require a key prop.
            /* eslint-disable react/jsx-key */
            user.principal_name,
            <>
                {user.email_address}
                {isNonUniqueEmail ? (
                    <Tooltip
                        title='检测到重复邮箱，系统将要求用户邮箱唯一，下一版本将由数据库强制执行。'
                        placement='top-start'>
                        <FontAwesomeIcon
                            icon={faWarning}
                            style={{ marginLeft: theme.spacing(1) }}
                            className='text-error'
                        />
                    </Tooltip>
                ) : null}
            </>,
            `${user.first_name} ${user.last_name}`,
            <span style={{ whiteSpace: 'pre' }}>
                {DateTime.fromISO(user.created_at).toFormat(LuxonFormat.DATETIME)}
            </span>,
            user.roles?.[0]?.name,
            getUserStatusText(user),
            getAuthMethodText(user),
            <UserActionsMenu
                userId={user.id}
                onOpen={(_, userId) => {
                    setSelectedUserId(userId);
                }}
                showPasswordOptions={!user.sso_provider_id}
                showAuthMgmtButtons={user.id !== getSelfQuery.data?.id}
                showDisableMfaButton={user.AuthSecret?.totp_activated}
                userDisabled={user.is_disabled}
                onUpdateUser={onUpdateUser}
                onDisableUser={onDisabledUser}
                onEnableUser={onEnabledUser}
                onDeleteUser={onDeleteUser}
                onUpdateUserPassword={onUpdateUserPassword}
                onExpireUserPassword={onExpiredUserPassword}
                onManageUserTokens={onManageUserTokens}
                onDisableUserMfa={() => setDisable2FADialogOpen(true)}
                index={index}
            />,
            /* eslint-enable react/jsx-key */
        ];
    });

    return (
        <DataTable
            headers={usersTableHeaders}
            data={usersTableRows}
            isLoading={listUsersQuery.isLoading}
            showPaginationControls={false}
        />
    );
};

export default UsersTable;
