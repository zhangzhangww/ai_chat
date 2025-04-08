<template>
    <div class="content">
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
            <router-link v-for="item in linkList" class="chat" :to="item.path" active-class="active" @click.native="closeMenuOnMobile">
                <svg t="1743130299530" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="21777" width="200" height="200">
                    <path
                        d="M0 0m256 0l512 0q256 0 256 256l0 512q0 256-256 256l-512 0q-256 0-256-256l0-512q0-256 256-256Z"
                        fill="currentColor" p-id="21778"></path>
                    <path
                        d="M729.045333 775.893333l0.042667 0.042667q8.106667 4.864 17.578667 4.864 3.370667 0 6.656-0.64 3.285333-0.682667 6.4-1.962667t5.888-3.157333q2.816-1.877333 5.205333-4.266667 2.346667-2.346667 4.266667-5.12 1.834667-2.816 3.114666-5.930666 1.28-3.114667 1.962667-6.4 0.64-3.285333 0.64-6.656 0-4.437333-1.109333-8.704-1.152-4.266667-3.328-8.106667-2.133333-3.84-5.248-7.04-3.114667-3.157333-6.869334-5.418667-122.752-73.642667-310.186666 20.053334-4.266667 2.133333-7.765334 5.333333-3.498667 3.242667-5.973333 7.253333-2.56 4.053333-3.84 8.618667-1.28 4.608-1.28 9.344 0 3.370667 0.64 6.656 0.682667 3.285333 1.962667 6.4t3.157333 5.888q1.877333 2.816 4.266667 5.205333 2.346667 2.346667 5.12 4.266667 2.816 1.834667 5.930666 3.114667 3.114667 1.28 6.4 1.962666 3.285333 0.64 6.656 0.64 8.064 0 15.274667-3.584 153.856-76.928 244.48-22.613333zM471.722667 615.466667c-63.402667 7.125333-108.458667 38.954667-135.168 95.573333q-3.797333 7.978667-7.082667 16.64c-2.005333 5.248-3.84 10.709333-5.589333 16.384-4.266667 13.738667-16.554667 23.936-30.933334 23.936a30.848 30.848 0 0 1-30.165333-36.522667 2128.64 2128.64 0 0 1 8.362667-41.941333c37.973333-177.664 130.986667-450.005333 486.784-474.453333 25.6-1.706667 43.178667 24.192 32.981333 47.786666q-36.266667 84.053333-72.618667 116.778667l-12.074666 10.88a22.869333 22.869333 0 0 0 0.298666 34.133333 21.632 21.632 0 0 1 5.717334 25.045334c-35.669333 78.122667-124.416 152.704-240.512 165.76z m158.72-206.976q0.256 19.285333 7.296 35.498666-20.608 32.128-55.893334 57.856-52.650667 38.442667-117.76 45.781334-49.365333 5.546667-88.021333 25.088 25.301333-67.541333 58.410667-115.712 93.184-135.68 266.837333-166.4-15.104 26.112-28.714667 38.357333l-12.074666 10.837333q-30.592 27.562667-30.08 68.693334z"
                        fill="#FFFFFF" p-id="21779"></path>
                </svg>
                {{ item.title }}</router-link>
        </div>
        
        <!-- 右侧内容区域 -->
        <div class="right">
            <router-view />
        </div>
        
        <!-- 底部版权信息 -->
        <div class="footer">
            <div class="footer-content">
                <div class="copyright">版权所有 © 《气象与环境科学》编辑部</div>
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
import { ref } from 'vue';

const linkList = ref([
    {
        path: '/FileAnalysis',
        title: '文档编校',
    },
    
    {
        path: '/account',
        title: '知识库管理',
    },
    {
        path: '/knowledge',
        title: '备用知识库',
    },
    {
        path: '/type',
        title: '知识库类型管理',
    },
    {
        path: '/readerList',
        title: '读本管理',
    },
    {
        path: '/home',
        title: '智能对话',
    },
]);

const isMenuVisible = ref(false);

const toggleMenu = () => {
    isMenuVisible.value = !isMenuVisible.value;
};

const closeMenuOnMobile = () => {
    if (window.innerWidth <= 768) {
        isMenuVisible.value = false;
    }
};
</script>

<style lang="scss" scoped>
.chat.active {
    background-color: #f0f4ff;
    color: #409eff;
    border-left: 3px solid #3366ff;
}

/* 默认图标颜色 */
.icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    color: #a8a8a8;
    vertical-align: middle;
}

/* 激活状态图标颜色 */
.active .icon {
    color: #409eff;
}

.content {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: auto;
    position: relative;
}

.left {
    position: fixed;
    min-width: 200px;
    height: 100%;
    padding: 40px 8px;
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
}

.right {
    width: 100%;
    padding-left: 200px;
    background: #F6F6F6;
    min-height: 100vh;
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
    top: 10px;
    left: 10px;
    z-index: 110;
    padding: 8px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .left {
        transform: translateX(-100%);
        width: 70%;
        max-width: 280px;
        padding-top: 50px;
        
        &.mobile-visible {
            transform: translateX(0);
        }
        
        .close-btn {
            display: block;
        }
    }
    
    .right {
        padding-left: 0;
    }
    
    .mobile-menu-btn {
        display: block;
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