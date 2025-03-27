<template>
    <div class="content">
        <div class="left">
            <router-link class="chat" to="/FileAnalysis" active-class="active"><img src="@/assets/images/deepseek.svg" alt="">文档编校</router-link>
            <router-link class="chat" to="/home" active-class="active"><img src="@/assets/images/deepseek.svg" alt="">智能对话</router-link>
            <router-link class="chat" to="/account" active-class="active"><img src="@/assets/images/deepseek.svg" alt="">提示词管理</router-link>

        </div>
        <div class="right">
            <router-view/>
        </div>
    </div>
</template>

<script setup>
const isSelect=ref('false')

</script>

<style lang="scss" scoped>
.chat.active {
  background-color: #f0f4ff;
  color: #3366ff;
  border-left: 3px solid #3366ff;
  
}

.content {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: auto;
    .left {
        position: fixed;
       // width: 12%;
        min-width: 200px;
        height: 100%;
        padding:40px 8px;
        background-color: #ffffff;
        border-right: #e6e6e6 solid 1px;
        .chat {
            margin-bottom: 4px;
            display: block;
            width: 100%;
            height: 40px;
            padding-left: 20px;
            line-height: 40px;
            font-size: 15px;
            text-decoration: none;
            color: #555;

            &:hover {
                background-color: #f0f4ff;
            }
            img{
                margin-right: 2px;
                width: 28px;
                height: 28px;
                vertical-align: middle;
            }
        }
    }
    .right {
        width: 100%;
        padding-left: 200px;
        background: #F6F6F6;
    }
}
</style>
