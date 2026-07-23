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

import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    Alert,
    AlertTitle,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Skeleton,
} from '@mui/material';
import {
    cn,
    Flag,
    PageWithTitle,
    Permission,
    useAppNavigate,
    useFeatureFlags,
    useMountEffect,
    useNotifications,
    usePermissions,
    useToggleFeatureFlag,
} from 'bh-shared-ui';
import { Button, Typography } from 'doodle-ui';
import { FC, useState } from 'react';
import { setDarkMode } from 'src/ducks/global/actions';
import { useAppDispatch } from 'src/store';

export const EarlyAccessFeatureToggle: React.FC<{
    flag: Flag;
    onClick: (flagId: number) => void;
    disabled: boolean;
}> = ({ flag, onClick, disabled }) => {
    const handleOnClick = () => {
        onClick(flag.id);
    };

    return (
        <div className='bg-neutral-2 shadow-outer-1'>
            <div className='p-4 flex justify-between gap-4'>
                <div className='overflow-hidden'>
                    <Typography variant='h6' component='h2'>
                        {flag.name}
                    </Typography>
                    <Typography variant='body1'>{flag.description}</Typography>
                </div>
                <div className='flex items-center justify-center'>
                    <Button disabled={disabled} onClick={handleOnClick} className='w-32'>
                        <div className='flex items-center'>
                            {flag.enabled ? (
                                <FontAwesomeIcon style={{ marginRight: '8px' }} icon={faCheckCircle} fixedWidth />
                            ) : null}
                            <Typography>{flag.enabled ? '已启用' : '已禁用'}</Typography>
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const EarlyAccessFeaturesWarningDialog: React.FC<{
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ open, onCancel, onConfirm }) => {
    return (
        <Dialog
            open={open}
            disableEscapeKeyDown
            PaperProps={{
                //@ts-ignore
                'data-testid': 'early-access-features-warning-dialog',
            }}>
            <DialogTitle>请注意！</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    此页面上的功能正在积极开发中，可能不稳定、有缺陷或不完整。
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    variant='secondary'
                    onClick={onCancel}
                    data-testid='early-access-features-warning-dialog_button-close'>
                    {'返回'}
                </Button>
                <Button
                    variant='primary'
                    onClick={onConfirm}
                    data-testid='early-access-features-warning-dialog_button-confirm'>
                    {'我已了解，让我看看新功能！'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const EarlyAccessFeatures: FC = () => {
    const [showWarningDialog, setShowWarningDialog] = useState(true);
    const dispatch = useAppDispatch();
    const navigate = useAppNavigate();
    const { data, isLoading, isError } = useFeatureFlags();
    const toggleFeatureFlag = useToggleFeatureFlag();

    const { checkPermission } = usePermissions();
    const hasPermission = checkPermission(Permission.APP_WRITE_APPLICATION_CONFIGURATION);

    const { addNotification, dismissNotification } = useNotifications();
    const notificationKey = 'manage-feature-flags-permission';

    const effect: React.EffectCallback = () => {
        if (!hasPermission) {
            addNotification(
                `您的角色没有管理功能标志的权限。请联系管理员了解详情。`,
                notificationKey,
                {
                    persist: true,
                    anchorOrigin: { vertical: 'top', horizontal: 'right' },
                }
            );
        }

        return () => dismissNotification(notificationKey);
    };

    useMountEffect(effect);

    return (
        <>
            <PageWithTitle
                title='早期访问功能'
                data-testid='early-access-features'
                pageDescription={
                    <Typography variant='body2'>
                        启用或禁用早期访问功能。这些功能可能不稳定、有缺陷或不完整，但可供测试使用。
                    </Typography>
                }>
                {!showWarningDialog &&
                    (isLoading ? (
                        <div className='bg-neutral-2'>
                            <div className='p-4'>
                                <Typography variant='h6' component='div'>
                                    <Skeleton />
                                </Typography>
                                <Typography variant='body1'>
                                    <Skeleton />
                                </Typography>
                            </div>
                        </div>
                    ) : isError ? (
                        <Alert severity='error'>
                            <AlertTitle>无法显示早期访问功能</AlertTitle>
                            发生意外错误。请刷新此页面或稍后重试。
                        </Alert>
                    ) : data!.filter((flag) => flag.user_updatable).length === 0 ? (
                        <div className='bg-neutral-2'>
                            <div className='p-4'>
                                <Typography variant='h2'>暂无早期访问功能</Typography>
                                <Typography variant='body1'>
                                    目前没有可用的早期访问功能。请稍后再查看。
                                </Typography>
                            </div>
                        </div>
                    ) : (
                        data!
                            .filter((flag) => flag.user_updatable)
                            .sort((a, b) => a.id - b.id)
                            .map((flag, index) => (
                                <div
                                    className={cn({ 'mt-4': index !== 0 })}
                                    key={flag.id}
                                    data-testid={`early-access-features_toggle-${index}`}>
                                    <EarlyAccessFeatureToggle
                                        flag={flag}
                                        onClick={(flagId) => {
                                            // TODO: Consider adding more flexibility/composability to side effects for toggling feature flags on and off
                                            if (flag.key === 'dark_mode') {
                                                dispatch(setDarkMode(false));
                                            }
                                            toggleFeatureFlag.mutate(flagId);
                                        }}
                                        disabled={showWarningDialog || !hasPermission}
                                    />
                                </div>
                            ))
                    ))}
            </PageWithTitle>
            <EarlyAccessFeaturesWarningDialog
                open={showWarningDialog}
                onCancel={() => navigate(-1)}
                onConfirm={() => setShowWarningDialog(false)}
            />
        </>
    );
};

export default EarlyAccessFeatures;
