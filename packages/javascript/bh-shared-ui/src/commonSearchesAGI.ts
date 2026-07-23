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

import { OWNED_OBJECT_TAG, TIER_ZERO_TAG } from './constants';
import { ActiveDirectoryPathfindingEdges, AzurePathfindingEdges } from './graphSchema';
import { CommonSearchType } from './types';

const categoryAD = 'Active Directory';
const categoryAzure = 'Azure';

const azureTransitEdgeTypes = AzurePathfindingEdges().join('|');
const adTransitEdgeTypes = ActiveDirectoryPathfindingEdges().join('|');

const highPrivilegedRoleDisplayNameRegex =
    '^(Global Administrator|User Administrator|Cloud Application Administrator|Authentication Policy Administrator|Exchange Administrator|Helpdesk Administrator|Privileged Authentication Administrator|Privileged Role Administrator).*$';

/*
    NOTE: temporarily there exists 2 common searches files, edits here should be reflected in ./commonSearchesAGT.ts as well
 */

export const CommonSearches: CommonSearchType[] = [
    {
        subheader: '域名信息',
        category: categoryAD,
        queries: [
            {
                name: '所有 Domain Admin',
                description: '',
                query: `MATCH p = (t:Group)<-[:MemberOf*1..]-(a)\nWHERE (a:User or a:Computer) and t.objectid ENDS WITH '-512'\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '映射域信任关系',
                description: '',
                query: `MATCH p = (:Domain)-[:SameForestTrust|CrossForestTrust]->(:Domain)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'Tier Zero / 高价值对象的位置',
                description: '',
                query: `MATCH p = (t:Base)<-[:Contains*1..]-(:Domain)\nWHERE COALESCE(t.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '映射 OU 结构',
                description: '',
                query: `MATCH p = (:Domain)-[:Contains*1..]->(:OU)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'AdminSDHolder 保护对象的位置',
                description: '',
                query: `MATCH p = (n:Base)<-[:Contains*1..]-(:Domain)\nWHERE n.adminsdholderprotected = True\nRETURN p\nLIMIT 1000`,
            },
        ],
    },
    {
        subheader: '危险权限',
        category: categoryAD,
        queries: [
            {
                name: '拥有 DCSync 权限的主体',
                description: '',
                query: `MATCH p=(:Base)-[:DCSync|AllExtendedRights|GenericAll]->(:Domain)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '拥有跨域组成员身份的主体',
                description: '',
                query: `MATCH p=(s:Base)-[:MemberOf]->(t:Group)\nWHERE s.domainsid<>t.domainsid\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'Domain Users 为本地管理员的计算机',
                description: '',
                query: `MATCH p=(s:Group)-[:AdminTo]->(:Computer)\nWHERE s.objectid ENDS WITH '-513'\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'Domain Users 可读取 LAPS 密码的计算机',
                description: '',
                query: `MATCH p=(s:Group)-[:AllExtendedRights|ReadLAPSPassword]->(:Computer)\nWHERE s.objectid ENDS WITH '-513'\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '从 Domain Users 到 Tier Zero / 高价值目标的路径',
                description: '',
                query: `MATCH p=shortestPath((s:Group)-[:${adTransitEdgeTypes}*1..]->(t))\nWHERE COALESCE(t.system_tags, '') CONTAINS '${TIER_ZERO_TAG}' AND s.objectid ENDS WITH '-513' AND s<>t\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'Domain Users 可以 RDP 的工作站',
                description: '',
                query: `MATCH p=(s:Group)-[:CanRDP]->(t:Computer)\nWHERE s.objectid ENDS WITH '-513' AND NOT toUpper(t.operatingsystem) CONTAINS 'SERVER'\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'Domain Users 可以 RDP 的服务器',
                description: '',
                query: `MATCH p=(s:Group)-[:CanRDP]->(t:Computer)\nWHERE s.objectid ENDS WITH '-513' AND toUpper(t.operatingsystem) CONTAINS 'SERVER'\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'Domain Users 组的危险权限',
                description: '',
                query: `MATCH p=(s:Group)-[r:${adTransitEdgeTypes}]->(:Base)\nWHERE s.objectid ENDS WITH '-513'\nAND NOT r:MemberOf\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'Domain Admin 登录到非域控制器',
                description: '',
                query: `MATCH (s)-[:MemberOf*0..]->(g:Group)\nWHERE g.objectid ENDS WITH '-516'\nWITH COLLECT(s) AS exclude\nMATCH p = (c:Computer)-[:HasSession]->(:User)-[:MemberOf*1..]->(g:Group)\nWHERE g.objectid ENDS WITH '-512' AND NOT c IN exclude\nRETURN p\nLIMIT 1000`,
            },
        ],
    },
    {
        subheader: 'Kerberos Interaction',
        category: categoryAD,
        queries: [
            {
                name: 'Tier Zero / 高价值组中可 Kerberoast 的成员',
                description: '',
                query: `MATCH (u:User)\nWHERE u.hasspn=true\nAND u.enabled = true\nAND NOT u.objectid ENDS WITH '-502'\nAND NOT COALESCE(u.gmsa, false) = true\nAND NOT COALESCE(u.msa, false) = true\nAND COALESCE(u.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nRETURN u\nLIMIT 100`,
            },
            {
                name: '所有可 Kerberoast 的用户',
                description: '',
                query: `MATCH (u:User)\nWHERE u.hasspn=true\nAND u.enabled = true\nAND NOT u.objectid ENDS WITH '-502'\nAND NOT COALESCE(u.gmsa, false) = true\nAND NOT COALESCE(u.msa, false) = true\nRETURN u\nLIMIT 100`,
            },
            {
                name: '拥有最多管理员权限的可 Kerberoast 用户',
                description: '',
                query: `MATCH (u:User)\nWHERE u.hasspn = true\n  AND u.enabled = true\n  AND NOT u.objectid ENDS WITH '-502'\n  AND NOT COALESCE(u.gmsa, false) = true\n  AND NOT COALESCE(u.msa, false) = true\nMATCH (u)-[:MemberOf|AdminTo*1..]->(c:Computer)\nWITH DISTINCT u, COUNT(c) AS adminCount\nRETURN u\nORDER BY adminCount DESC\nLIMIT 100`,
            },
            {
                name: '可 AS-REP Roast 的用户 (DontReqPreAuth)',
                description: '',
                query: `MATCH (u:User)\nWHERE u.dontreqpreauth = true\nAND u.enabled = true\nRETURN u\nLIMIT 100`,
            },
        ],
    },
    {
        subheader: 'Shortest Paths',
        category: categoryAD,
        queries: [
            {
                name: '到非约束委派信任系统的最短路径',
                description: '',
                query: `MATCH p=shortestPath((s)-[:${adTransitEdgeTypes}*1..]->(t:Computer))\nWHERE t.unconstraineddelegation = true AND s<>t\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '从可 Kerberoast 用户到 Domain Admin 的最短路径',
                description: '',
                query: `MATCH p=shortestPath((s:User)-[:${adTransitEdgeTypes}*1..]->(t:Group))\nWHERE s.hasspn=true\nAND s.enabled = true\nAND NOT s.objectid ENDS WITH '-502'\nAND NOT COALESCE(s.gmsa, false) = true\nAND NOT COALESCE(s.msa, false) = true\nAND t.objectid ENDS WITH '-512'\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '到 Tier Zero / 高价值目标的最短路径',
                description: '',
                query: `MATCH p=shortestPath((s)-[:${adTransitEdgeTypes}*1..]->(t))\nWHERE COALESCE(t.system_tags, '') CONTAINS '${TIER_ZERO_TAG}' AND s<>t\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '从 Domain Users 到 Tier Zero / 高价值目标的最短路径',
                description: '',
                query: `MATCH p=shortestPath((s:Group)-[:${adTransitEdgeTypes}*1..]->(t))\nWHERE COALESCE(t.system_tags, '') CONTAINS '${TIER_ZERO_TAG}' AND s.objectid ENDS WITH '-513' AND s<>t\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '到 Domain Admin 的最短路径',
                description: '',
                query: `MATCH p=shortestPath((t:Group)<-[:${adTransitEdgeTypes}*1..]-(s:Base))\nWHERE t.objectid ENDS WITH '-512' AND s<>t\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '从已控制对象到 Tier Zero 的最短路径',
                description: '',
                query: `// MANY TO MANY SHORTEST PATH QUERIES USE EXCESSIVE SYSTEM RESOURCES AND TYPICALLY WILL NOT COMPLETE\n// UNCOMMENT THE FOLLOWING LINES BY REMOVING THE DOUBLE FORWARD SLASHES AT YOUR OWN RISK\n// MATCH p=shortestPath((s)-[:${adTransitEdgeTypes}*1..]->(t))\n// WHERE COALESCE(t.system_tags, '') CONTAINS '${TIER_ZERO_TAG}' AND s<>t\n// AND COALESCE(s.system_tags, '') CONTAINS '${OWNED_OBJECT_TAG}'\n// RETURN p\n// LIMIT 1000`,
            },
            {
                name: '从已控制对象出发的最短路径',
                description: '',
                query: `MATCH p=shortestPath((s:Base)-[:${adTransitEdgeTypes}*1..]->(t:Base))\nWHERE COALESCE(s.system_tags, '') CONTAINS '${OWNED_OBJECT_TAG}' AND s<>t\nRETURN p\nLIMIT 1000`,
            },
        ],
    },
    {
        subheader: 'Active Directory Certificate Services',
        category: categoryAD,
        queries: [
            {
                name: 'PKI 层级结构',
                description: '',
                query: `MATCH p=()-[:HostsCAService|IssuedSignedBy|EnterpriseCAFor|RootCAFor|TrustedForNTAuth|NTAuthStoreFor*..]->(:Domain)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'Public Key Services 容器',
                description: '',
                query: `MATCH p = (c:Container)-[:Contains*..]->(:Base)\nWHERE c.distinguishedname starts with 'CN=PUBLIC KEY SERVICES,CN=SERVICES,CN=CONFIGURATION,DC='\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '已发布证书模板的注册权限',
                description: '',
                query: `MATCH p = (:Base)-[:Enroll|GenericAll|AllExtendedRights]->(:CertTemplate)-[:PublishedTo]->(:EnterpriseCA)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '已发布 ESC1 证书模板的注册权限',
                description: '',
                query: `MATCH p = (:Base)-[:Enroll|GenericAll|AllExtendedRights]->(ct:CertTemplate)-[:PublishedTo]->(:EnterpriseCA)\nWHERE ct.enrolleesuppliessubject = True\nAND ct.authenticationenabled = True\nAND ct.requiresmanagerapproval = False\nAND (ct.authorizedsignatures = 0 OR ct.schemaversion = 1)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '已发布 ESC2 证书模板的注册权限',
                description: '',
                query: `MATCH p = (:Base)-[:Enroll|GenericAll|AllExtendedRights]->(c:CertTemplate)-[:PublishedTo]->(:EnterpriseCA)\nWHERE c.requiresmanagerapproval = false\nAND (c.effectiveekus = [''] OR '2.5.29.37.0' IN c.effectiveekus OR c.effectiveekus IS NULL)\nAND (c.authorizedsignatures = 0 OR c.schemaversion = 1)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '已发布注册代理证书模板的注册权限',
                description: '',
                query: `MATCH p = (:Base)-[:Enroll|GenericAll|AllExtendedRights]->(ct:CertTemplate)-[:PublishedTo]->(:EnterpriseCA)\nWHERE '1.3.6.1.4.1.311.20.2.1' IN ct.effectiveekus\nOR '2.5.29.37.0' IN ct.effectiveekus\nOR SIZE(ct.effectiveekus) = 0\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '无安全扩展的已发布证书模板的注册权限',
                description: '',
                query: `MATCH p = (:Base)-[:Enroll|GenericAll|AllExtendedRights]->(ct:CertTemplate)-[:PublishedTo]->(:EnterpriseCA)\nWHERE ct.nosecurityextension = true\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'ADCS 节点上的危险权限 (ESC5)',
                description: '',
                query: `MATCH p = (n:Base)-[:Owns|WriteOwner|WriteDacl|GenericAll|GenericWrite]->(m:Base)
WHERE m.distinguishedname CONTAINS "PUBLIC KEY SERVICES"
AND NOT n.objectid ENDS WITH "-512" // Domain Admins
AND NOT n.objectid ENDS WITH "-519" // Enterprise Admins
AND NOT n.objectid ENDS WITH "-544" // Administrators
RETURN p\nLIMIT 1000`,
            },
            {
                name: '发布到启用了 User Specified SAN 的企业 CA 的证书模板的注册权限 (ESC6)',
                description: '',
                query: `MATCH p = (:Base)-[:Enroll|GenericAll|AllExtendedRights]->(ct:CertTemplate)-[:PublishedTo]->(eca:EnterpriseCA)\nWHERE eca.isuserspecifiessanenabled = True\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'CA 管理员和 CA 管理器 (ESC7)',
                description: '',
                query: `MATCH p = (:Base)-[:ManageCertificates|ManageCA]->(:EnterpriseCA)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '发布到存在 HTTP(S) 漏洞端点的企业 CA 的证书模板的注册权限 (ESC8)',
                description: '',
                query: `MATCH p = (:Base)-[:Enroll|GenericAll|AllExtendedRights]->(ct:CertTemplate)-[:PublishedTo]->(eca:EnterpriseCA)\nWHERE eca.hasvulnerableendpoint = True\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '启用了弱证书绑定的域控制器',
                description: '',
                query: `MATCH p = (s:Computer)-[:DCFor]->(:Domain)\nWHERE s.strongcertificatebindingenforcementraw = 0 OR s.strongcertificatebindingenforcementraw = 1\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '启用了 UPN 证书映射的域控制器',
                description: '',
                query: `MATCH p = (s:Computer)-[:DCFor]->(:Domain)\nWHERE s.certificatemappingmethodsraw IN [4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23, 28, 29, 30, 31]\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'IssuancePolicy 节点上的非默认权限',
                description: '',
                query: `MATCH p = (s:Base)-[:GenericAll|GenericWrite|Owns|WriteOwner|WriteDacl]->(:IssuancePolicy)\nWHERE NOT s.objectid ENDS WITH '-512' AND NOT s.objectid ENDS WITH '-519'\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '带有 OIDGroupLink 的 CertTemplate 的注册权限',
                description: '',
                query: `MATCH p = (:Base)-[:Enroll|GenericAll|AllExtendedRights]->(:CertTemplate)-[:ExtendedByPolicy]->(:IssuancePolicy)-[:OIDGroupLink]->(:Group)\nRETURN p\nLIMIT 1000`,
            },
        ],
    },
    {
        subheader: 'Active Directory Hygiene',
        category: categoryAD,
        queries: [
            {
                name: '60 天未活动的已启用 Tier Zero / 高价值主体',
                description: '',
                query: `WITH 60 as inactive_days\nMATCH (n:Base)\nWHERE COALESCE(n.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nAND n.enabled = true\nAND n.lastlogontimestamp < (datetime().epochseconds - (inactive_days * 86400)) // Replicated value\nAND n.lastlogon < (datetime().epochseconds - (inactive_days * 86400)) // Non-replicated value\nAND n.whencreated < (datetime().epochseconds - (inactive_days * 86400)) // Exclude recently created principals\nAND NOT n.name STARTS WITH 'AZUREADKERBEROS.' // Removes false positive, Azure KRBTGT\nAND NOT n.objectid ENDS WITH '-500' // Removes false positive, built-in Administrator\nAND NOT n.name STARTS WITH 'AZUREADSSOACC.' // Removes false positive, Entra Seamless SSO\nRETURN n`,
            },
            {
                name: '不需要智能卡认证的已启用 Tier Zero / 高价值用户',
                description: '',
                query: `MATCH (u:User)\nWHERE COALESCE(u.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nAND u.enabled = true\nAND u.smartcardrequired = false\nAND NOT u.name STARTS WITH 'MSOL_' // Removes false positive, Entra sync\nAND NOT u.name STARTS WITH 'PROVAGENTGMSA' // Removes false positive, Entra sync\nAND NOT u.name STARTS WITH 'ADSYNCMSA_' // Removes false positive, Entra sync\nRETURN u`,
            },
            {
                name: '任何用户都可以将计算机加入域的域',
                description: '',
                query: `MATCH (d:Domain)\nWHERE d.machineaccountquota > 0\nRETURN d`,
            },
            {
                name: '智能卡账户密码不过期的域',
                description: '',
                query: `MATCH (s:Domain)-[:Contains*1..]->(t:Base)\nWHERE s.expirepasswordsonsmartcardonlyaccounts = false\nAND t.enabled = true\nAND t.smartcardrequired = true\nRETURN s`,
            },
            {
                name: '具有可滥用配置的跨林信任',
                description: '',
                query: `MATCH p=(n:Domain)-[:CrossForestTrust|SpoofSIDHistory|AbuseTGTDelegation]-(m:Domain)\nWHERE (n)-[:SpoofSIDHistory|AbuseTGTDelegation]-(m)\nRETURN p`,
            },
            {
                name: '运行不受支持操作系统的计算机',
                description: '',
                query: `MATCH (c:Computer)\nWHERE c.operatingsystem =~ '(?i).*Windows.* (2000|2003|2008|2012|xp|vista|7|8|me|nt).*'\nRETURN c\nLIMIT 100`,
            },
            {
                name: '不需要密码即可认证的用户',
                description: '',
                query: `MATCH (u:User)\nWHERE u.passwordnotreqd = true\nRETURN u\nLIMIT 100`,
            },
            {
                name: '超过 1 年未轮换密码的用户',
                description: '',
                query: `WITH 365 as days_since_change\nMATCH (u:User)\nWHERE u.pwdlastset < (datetime().epochseconds - (days_since_change * 86400))\nAND NOT u.pwdlastset IN [-1.0, 0.0]\nRETURN u\nLIMIT 100`,
            },
            {
                name: 'Tier Zero / 高价值内的嵌套组',
                description: '',
                query: `MATCH p=(t:Group)<-[:MemberOf*..]-(s:Group)\nWHERE COALESCE(t.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nAND NOT s.objectid ENDS WITH '-512' // Domain Admins\nAND NOT s.objectid ENDS WITH '-519' // Enterprise Admins\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '已禁用的 Tier Zero / 高价值主体',
                description: '',
                query: `MATCH (n:Base)\nWHERE COALESCE(n.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nAND n.enabled = false\nAND NOT n.objectid ENDS WITH '-502' // Removes false positive, KRBTGT\nAND NOT n.objectid ENDS WITH '-500' // Removes false positive, built-in Administrator\nRETURN n\nLIMIT 100`,
            },
            {
                name: '使用可逆加密存储密码的主体',
                description: '',
                query: `MATCH (n:Base)\nWHERE n.encryptedtextpwdallowed = true\nRETURN n`,
            },
            {
                name: '仅使用 DES Kerberos 认证的主体',
                description: '',
                query: `MATCH (n:Base)\nWHERE n.enabled = true\nAND n.usedeskeyonly = true\nRETURN n`,
            },
            {
                name: '支持弱 Kerberos 加密类型的主体',
                description: '',
                query: `MATCH (u:Base)\nWHERE 'DES-CBC-CRC' IN u.supportedencryptiontypes\nOR 'DES-CBC-MD5' IN u.supportedencryptiontypes\nOR 'RC4-HMAC-MD5' IN u.supportedencryptiontypes\nRETURN u`,
            },
            {
                name: '密码不过期的 Tier Zero / 高价值用户',
                description: '',
                query: `MATCH (u:User)\nWHERE u.enabled = true\nAND u.pwdneverexpires = true\nand COALESCE(u.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nRETURN u\nLIMIT 100`,
            },
            {
                name: '不受 AdminSDHolder 保护的 Tier Zero 主体',
                description: '',
                query: `MATCH (n:Base)\nWHERE COALESCE(n.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nAND n.adminsdholderprotected = false\nRETURN n\nLIMIT 500`,
            },
            {
                name: 'AdminSDHolder 到受保护对象的关系',
                description: '',
                query: `MATCH p=(n)-[:ProtectAdminGroups]->(m)\nRETURN p\nLIMIT 1000`,
            },
        ],
    },
    {
        subheader: 'General',
        category: categoryAzure,
        queries: [
            {
                name: '所有全局管理员',
                description: '',
                query: `MATCH p = (:AZBase)-[:AZGlobalAdmin*1..]->(:AZTenant)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '所有高特权角色的成员',
                description: '',
                query: `MATCH p=(t:AZRole)<-[:AZHasRole|AZMemberOf*1..2]-(:AZBase)\nWHERE t.name =~ '(?i)${highPrivilegedRoleDisplayNameRegex}'\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '直接符合 Entra 管理员角色条件的 Entra 用户',
                description: '',
                query: `MATCH p = (:AZUser)-[:AZRoleEligible]->(:AZRole)\nRETURN p LIMIT 100`,
            },
            {
                name: '通过组委派符合 Entra 管理员角色条件的 Entra 用户',
                description: '',
                query: `MATCH p = (:AZUser)-[:AZMemberOf]->(:AZGroup)-[:AZRoleEligible]->(:AZRole)\nRETURN p LIMIT 100`,
            },
            {
                name: '直接审批 Entra 管理员角色的 Entra 用户',
                description: '',
                query: `MATCH p = (:AZUser)-[:AZRoleApprover]->(:AZRole)\nRETURN p LIMIT 100`,
            },
            {
                name: '通过组委派审批 Entra 管理员角色的 Entra 用户',
                description: '',
                query: `MATCH p = (:AZUser)-[:AZMemberOf]->(:AZGroup)-[:AZRoleApprover]->(:AZRole)\nRETURN p LIMIT 100`,
            },
        ],
    },
    {
        subheader: 'Shortest Paths',
        category: categoryAzure,
        queries: [
            {
                name: '从 Entra 用户到 Tier Zero / 高价值目标的最短路径',
                description: '',
                query: `MATCH p=shortestPath((s:AZUser)-[:${azureTransitEdgeTypes}*1..]->(t:AZBase))\nWHERE COALESCE(t.system_tags, '') CONTAINS '${TIER_ZERO_TAG}' AND s<>t\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '到特权角色的最短路径',
                description: '',
                query: `MATCH p=shortestPath((s:AZBase)-[:${azureTransitEdgeTypes}*1..]->(t:AZRole))\nWHERE t.name =~ '(?i)${highPrivilegedRoleDisplayNameRegex}' AND s<>t\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '从 Azure 应用程序到 Tier Zero / 高价值目标的最短路径',
                description: '',
                query: `MATCH p=shortestPath((s:AZApp)-[:${azureTransitEdgeTypes}*1..]->(t:AZBase))\nWHERE COALESCE(t.system_tags, '') CONTAINS '${TIER_ZERO_TAG}' AND s<>t\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '到 Azure 订阅的最短路径',
                description: '',
                query: `MATCH p=shortestPath((s:AZBase)-[:${azureTransitEdgeTypes}*1..]->(t:AZSubscription))\nWHERE s<>t\nRETURN p\nLIMIT 1000`,
            },
        ],
    },
    {
        subheader: 'Microsoft Graph',
        category: categoryAzure,
        queries: [
            {
                name: '拥有 Microsoft Graph 权限可授予任意 App Role 的所有 Service Principal',
                description: '',
                query: `MATCH p=(:AZServicePrincipal)-[:AZMGGrantAppRoles]->(:AZTenant)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '拥有 Microsoft Graph App Role 分配的所有 Service Principal',
                description: '',
                query: `MATCH p=(:AZServicePrincipal)-[:AZMGAppRoleAssignment_ReadWrite_All|AZMGApplication_ReadWrite_All|AZMGDirectory_ReadWrite_All|AZMGGroupMember_ReadWrite_All|AZMGGroup_ReadWrite_All|AZMGRoleManagement_ReadWrite_Directory|AZMGServicePrincipalEndpoint_ReadWrite_All]->(:AZServicePrincipal)\nRETURN p\nLIMIT 1000`,
            },
        ],
    },
    {
        subheader: 'Azure Hygiene',
        category: categoryAzure,
        queries: [
            {
                name: 'Tier Zero / 高价值目标中的外部主体',
                description: '',
                query: `MATCH (n:AZServicePrincipal)\nWHERE COALESCE(n.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nAND NOT toUpper(n.appownerorganizationid) = toUpper(n.tenantid)\nAND n.appownerorganizationid CONTAINS '-'\nRETURN n\nLIMIT 100`,
            },
            {
                name: '与 Entra ID 同步的 Tier Zero AD 主体',
                description: '',
                query: `MATCH (ENTRA:AZBase)\nMATCH (AD:Base)\nWHERE ENTRA.onpremsyncenabled = true\nAND ENTRA.onpremid = AD.objectid\nAND COALESCE(AD.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nRETURN ENTRA\n// Replace 'RETURN ENTRA' with 'RETURN AD' to see the corresponding AD principals\nLIMIT 100`,
            },
            {
                name: 'Tier Zero / 高价值外部 Entra ID 用户',
                description: '',
                query: `MATCH (n:AZUser)\nWHERE COALESCE(n.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nAND n.name CONTAINS '#EXT#@'\nRETURN n\nLIMIT 100`,
            },
            {
                name: '已禁用的 Tier Zero / 高价值主体',
                description: '',
                query: `MATCH (n:AZBase)\nWHERE COALESCE(n.system_tags, '') CONTAINS '${TIER_ZERO_TAG}'\nAND n.enabled = false\nRETURN n\nLIMIT 100`,
            },
            {
                name: '运行不受支持操作系统的设备',
                description: '',
                query: `MATCH (n:AZDevice)\nWHERE n.operatingsystem CONTAINS 'WINDOWS'\nAND n.operatingsystemversion =~ '(10.0.19044|10.0.22000|10.0.19043|10.0.19042|10.0.19041|10.0.18363|10.0.18362|10.0.17763|10.0.17134|10.0.16299|10.0.15063|10.0.14393|10.0.10586|10.0.10240|6.3.9600|6.2.9200|6.1.7601|6.0.6200|5.1.2600|6.0.6003|5.2.3790|5.0.2195).?.*'\nRETURN n\nLIMIT 100`,
            },
        ],
    },
    {
        subheader: 'Cross Platform Attack Paths',
        category: categoryAzure,
        queries: [
            {
                name: '从本地用户同步到 Entra 用户并加入 Domain Admin 组',
                description: '',
                query: `MATCH p = (:AZUser)-[:SyncedToADUser]->(:User)-[:MemberOf]->(t:Group)\nWHERE t.objectid ENDS WITH '-512'\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '同步到 Entra 用户并直接拥有 Entra 管理员角色的本地用户',
                description: '',
                query: `MATCH p = (:User)-[:SyncedToEntraUser]->(:AZUser)-[:AZHasRole]->(:AZRole)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '同步到 Entra 用户并通过组委派拥有 Entra 管理员角色的本地用户',
                description: '',
                query: `MATCH p = (:User)-[:SyncedToEntraUser]->(:AZUser)-[:AZMemberOf]->(:AZGroup)-[:AZHasRole]->(:AZRole)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '同步到 Entra 用户并直接拥有 Azure RM 角色的本地用户',
                description: '',
                query: `MATCH p = (:User)-[:SyncedToEntraUser]->(:AZUser)-[:AZOwner|AZUserAccessAdministrator|AZGetCertificates|AZGetKeys|AZGetSecrets|AZAvereContributor|AZKeyVaultContributor|AZContributor|AZVMAdminLogin|AZVMContributor|AZAKSContributor|AZAutomationContributor|AZLogicAppContributor|AZWebsiteContributor]->(:AZBase)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '同步到 Entra 用户并通过组委派拥有 Azure RM 角色的本地用户',
                description: '',
                query: `MATCH p = (:User)-[:SyncedToEntraUser]->(:AZUser)-[:AZMemberOf]->(:AZGroup)-[:AZOwner|AZUserAccessAdministrator|AZGetCertificates|AZGetKeys|AZGetSecrets|AZAvereContributor|AZKeyVaultContributor|AZContributor|AZVMAdminLogin|AZVMContributor|AZAKSContributor|AZAutomationContributor|AZLogicAppContributor|AZWebsiteContributor]->(:AZBase)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '同步到 Entra 用户并拥有 Entra 对象所有权的本地用户',
                description: '',
                query: `MATCH p = (:User)-[:SyncedToEntraUser]->(:AZUser)-[:AZOwns]->(:AZBase)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: '同步到 Entra 用户并拥有 Entra 组成员身份的本地用户',
                description: '',
                query: `MATCH p = (:User)-[:SyncedToEntraUser]->(:AZUser)-[:AZMemberOf]->(:AZGroup)\nRETURN p\nLIMIT 1000`,
            },
            {
                name: 'Synced Entra Users with Entra Admin Role direct eligibility',
                description: '',
                query: `MATCH p = (:User)-[:SyncedToEntraUser]->(:AZUser)-[:AZRoleEligible]->(:AZRole)\nRETURN p LIMIT 100`,
            },
            {
                name: 'Synced Entra Users with Entra Admin Roles group delegated eligibility',
                description: '',
                query: `MATCH p = (:User)-[:SyncedToEntraUser]->(:AZUser)-[:AZMemberOf]->(:AZGroup)-[:AZRoleEligible]->(:AZRole)\nRETURN p LIMIT 100`,
            },
            {
                name: 'Synced Entra Users with Entra Admin Role approval (direct)',
                description: '',
                query: `MATCH p = (:User)-[:SyncedToEntraUser]->(:AZUser)-[:AZRoleApprover]->(:AZRole)\nRETURN p LIMIT 100`,
            },
            {
                name: 'Synced Entra Users with Entra Admin Role approval (group delegated)',
                description: '',
                query: `MATCH p = (:User)-[:SyncedToEntraUser]->(:AZUser)-[:AZMemberOf]->(:AZGroup)-[:AZRoleApprover]->(:AZRole)\nRETURN p LIMIT 100`,
            },
        ],
    },
    {
        subheader: 'NTLM Relay Attacks',
        category: categoryAD,
        queries: [
            {
                name: 'All coerce and NTLM relay edges',
                description: '',
                query: `MATCH p = (n:Base)-[:CoerceAndRelayNTLMToLDAP|CoerceAndRelayNTLMToLDAPS|CoerceAndRelayNTLMToADCS|CoerceAndRelayNTLMToSMB]->(:Base)\nRETURN p LIMIT 500`,
            },
            {
                name: 'ESC8-vulnerable Enterprise CAs',
                description: '',
                query: `MATCH (n:EnterpriseCA)\nWHERE n.hasvulnerableendpoint=true\nRETURN n`,
            },
            {
                name: 'Computers with the outgoing NTLM setting set to Deny all',
                description: '',
                query: `MATCH (c:Computer)\nWHERE c.restrictoutboundntlm = True\nRETURN c LIMIT 1000`,
            },
            {
                name: 'All members of Protected Users',
                description: '',
                query: `MATCH p = (:Base)-[:MemberOf*1..]->(g:Group)\nWHERE g.objectid ENDS WITH '-525'\nRETURN p LIMIT 1000`,
            },
            {
                name: 'DCs vulnerable to NTLM relay to LDAP attacks',
                description: '',
                query: `MATCH p = (dc:Computer)-[:DCFor]->(:Domain)\nWHERE (dc.ldapavailable = True AND dc.ldapsigning = False)\nOR (dc.ldapsavailable = True AND dc.ldapsepa = False)\nOR (dc.ldapavailable = True AND dc.ldapsavailable = True AND dc.ldapsigning = False and dc.ldapsepa = True)\nRETURN p`,
            },
            {
                name: 'Computers with the WebClient running',
                description: '',
                query: `MATCH (c:Computer)\nWHERE c.webclientrunning = True\nRETURN c LIMIT 1000`,
            },
            {
                name: 'Computers not requiring inbound SMB signing',
                description: '',
                query: `MATCH (n:Computer)\nWHERE n.smbsigning = False\nRETURN n`,
            },
        ],
    },
];
