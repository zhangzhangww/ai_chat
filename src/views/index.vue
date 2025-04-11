<template>
    <div class="content">
        <!-- 头部区域 -->
        <div class="header">
            <div class="header-left">
                <div class="logo">科技文章全文智能编校系统</div>
                <div class="system-name">（v1.0）</div>
            </div>
            <div class="admin-btn" @click="handleLogin" v-if="!hasToken">
                登录
                <svg viewBox="0 0 24 24" width="16" height="16" class="admin-icon" >
                    <path fill="currentColor" d="M7 10l5 5 5-5z"></path>
                </svg>
            </div>
            <div class="admin-btn" @click="handleAdminClick" v-if="hasToken">
               退出登录
                <svg viewBox="0 0 24 24" width="16" height="16" class="admin-icon" >
                    <path fill="currentColor" d="M7 10l5 5 5-5z"></path>
                </svg>
            </div>
        </div>
        
        <!-- 移动端汉堡菜单按钮 -->
        <div class="mobile-menu-btn" @click="toggleMenu">
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
            </svg>
        </div>
        
        <!-- 左侧导航区域 -->
        <div class="left" :class="{ 'mobile-visible': isMenuVisible }">
            <div class="close-btn" @click="toggleMenu">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                </svg>
            </div>
            <router-link v-for="item in visibleLinks" class="chat" :to="item.path" active-class="active" @click.native="closeMenuOnMobile">
                {{ item.title }}</router-link>
            
            <!-- 管理员模块 -->
            <div class="admin-modules" v-if=" hasToken">
                <div class="module-title">管理模块</div>
                <router-link 
                    v-for="item in adminLinks" 
                    class="chat admin-link" 
                    :to="item.path" 
                    active-class="active" 
                    @click.native="closeMenuOnMobile">
                    {{ item.title }}
                </router-link>
            </div>
        </div>
        
        <!-- 右侧内容区域 -->
        <div class="right">
            <router-view />
        </div>
        
        <!-- 底部版权信息 -->
        <div class="footer">
            <div class="footer-content">
                <div class="copyright">版权所有 © 河南省气象局《气象与环境科学》编辑部</div>
                <div class="contact">
                    <span class="phone">电话：<span class="highlight">0371-65922877</span></span>
                    <span class="divider">|</span>
                    <span class="tech-support">技术支持：河南省历象信息技术有限责任公司</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();

// 检查cookie中是否有token
const hasToken = ref(false);

// 从cookie中获取token
const getTokenFromCookie = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token' && value) {
            return value;
        }
    }
    return null;
};

// 检查token是否存在
const checkToken = () => {
    const token = getTokenFromCookie();
    hasToken.value = !!token;
};

onMounted(() => {
    checkToken();
});

const linkList = ref([
    {
        path: '/FileAnalysis',
        title: '文章编校',
    },
    {
        path: '/home',
        title: '智能对话',
    },
]);

const adminLinks = ref([
    {
        path: '/admin/account',
        title: '知识库管理',
    },
    {
        path: '/admin/knowledge',
        title: '备用知识库',
    },
    {
        path: '/admin/type',
        title: '知识库类型管理',
    },
    {
        path: '/admin/readerList',
        title: '读本管理',
    },
]);

const isMenuVisible = ref(false);

const visibleLinks = computed(() => {
    return linkList.value;
});

const toggleMenu = () => {
    isMenuVisible.value = !isMenuVisible.value;
};

const handleLogin = () => {
   
        router.push('/login');
    
};
const handleAdminClick= () => {
    // 清除cookie中的token
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    hasToken.value = false;
    ElMessage.error( '退出登录')
    router.push('/login');
}

const closeMenuOnMobile = () => {
    if (window.innerWidth <= 768) {
        isMenuVisible.value = false;
    }
};
</script>

<style lang="scss" scoped>
/* 之前的样式保持不变 */
.chat.active {
    background-color: #f0f4ff;
    color: #409eff;
    border-left: 3px solid #3366ff;
}

.icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    color: #a8a8a8;
    vertical-align: middle;
}

.active .icon {
    color: #409eff;
}

.header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background-color: #000;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    z-index: 105;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    
    .header-left {
        display: flex;
        align-items: center;
        
        .logo {
            font-size: 20px;
            font-weight: bold;
            color: #fff;
            margin-right: 12px;
        }
        
        .system-name {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.8);
            position: relative;
            padding-left: 12px;
            
            &::before {
                content: "";
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                height: 60%;
                width: 1px;
                background: rgba(255, 255, 255, 0.3);
            }
        }
    }
    
    .admin-btn {
        position: relative;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: all 0.3s;
        font-size: 14px;
        
        &:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .admin-icon {
            margin-left: 8px;
            transition: transform 0.3s;
            
            &.rotate {
                transform: rotate(180deg);
            }
        }
    }
}

.content {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: auto;
    position: relative;
    padding-top: 60px;
}

.left {
    position: fixed;
    min-width: 200px;
    height: calc(100% - 60px);
    top: 60px;
    padding: 20px 0;
    background-color: #ffffff;
    border-right: #e6e6e6 solid 1px;
    z-index: 100;
    transition: transform 0.3s ease;
    
    .chat {
        margin-bottom: 4px;
        display: block;
        width: 100%;
        height: 40px;
        padding-left: 20px;
        line-height: 40px;
        font-size: 14px;
        text-decoration: none;
        color: #333;
        
        &:hover {
            background-color: #f0f4ff;
        }
    }
    
    .close-btn {
        display: none;
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: pointer;
        padding: 5px;
    }
    
    .admin-modules {
        margin-top: 20px;
        border-top: 1px solid #eee;
        padding-top: 10px;
        
        .module-title {
            padding-left: 20px;
            font-size: 12px;
            color: #999;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .admin-link {
            padding-left: 30px !important;
            font-size: 13px;
            color: #666;
            
            &:hover {
                background-color: #f8f8f8;
            }
            
            &.active {
                background-color: #f0f4ff;
                color: #409eff;
                border-left: 3px solid #3366ff;
            }
        }
    }
}

.right {
    width: 100%;
    padding-left: 200px;
    background: #F6F6F6;
    min-height: calc(100vh - 60px);
}

.footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 90;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    
    .footer-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        max-width: 1200px;
        width: 100%;
        padding: 0 20px;
        
        .copyright {
            font-size: 14px;
            color: #666;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        .contact {
            display: flex;
            align-items: center;
            font-size: 12px;
            color: #888;
            
            .divider {
                margin: 0 12px;
                color: #ccc;
            }
            
            .highlight {
                color: #409eff;
                font-weight: 500;
            }
        }
    }
}

.mobile-menu-btn {
    display: none;
    position: fixed;
    top: 70px;
    left: 10px;
    z-index: 110;
    padding: 8px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
}

@media (max-width: 768px) {
    .header {
        height: 50px;
        padding: 0 15px;
        
        .header-left {
            .logo {
                font-size: 18px;
                margin-right: 8px;
            }
            
            .system-name {
                font-size: 14px;
                padding-left: 8px;
            }
        }
        
        .admin-btn {
            padding: 6px 12px;
            font-size: 13px;
        }
    }
    
    .content {
        padding-top: 50px;
    }
    
    .left {
        height: calc(100% - 50px);
        top: 50px;
        transform: translateX(-100%);
        width: 70%;
        max-width: 280px;
        padding-top: 20px;
        
        &.mobile-visible {
            transform: translateX(0);
        }
        
        .close-btn {
            display: block;
        }
    }
    
    .right {
        padding-left: 0;
        min-height: calc(100vh - 50px);
    }
    
    .mobile-menu-btn {
        top: 60px;
    }
    
    .footer {
        height: 80px;
        padding: 10px 0;
        
        .footer-content {
            flex-direction: column;
            
            .copyright {
                margin-bottom: 8px;
            }
            
            .contact {
                flex-direction: column;
                align-items: center;
                
                .divider {
                    display: none;
                }
                
                .tech-support {
                    margin-top: 4px;
                }
            }
        }
    }
}

@media (min-width: 769px) and (max-width: 992px) {
    .left {
        min-width: 180px;
    }
    
    .right {
        padding-left: 180px;
    }
}
</style>