<template>
    <div class="content">
        <div class="left">
            <router-link class="chat" to="/home" active-class="select"><img src="@/assets/images/deepseek.svg" alt="">智能对话</router-link>
            <router-link class="chat" to="/FileAnalysis" active-class="select"><img src="@/assets/images/deepseek.svg" alt="">软件上传</router-link>

        </div>
        <div class="right">
            <router-view/>
        </div>
    </div>
</template>

<script setup>

</script>

<style lang="scss" scoped>
.select {
    color: #0084ff;
}

.content {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: auto;
    .left {
        position: fixed;
        width: 12%;
        min-width: 200px;
        height: 100%;
        padding:40px 8px;
        background-color: #ffffff;
        border-right: #e6e6e6 solid 1px;
        .chat {
            display: block;
            width: 100%;
            height: 40px;
            padding-left: 20px;
            line-height: 40px;
            color: #000000;
            font-size: 15px;
            text-decoration: none;

            &:hover {
                color: #0084ff;
                background-color: #f0f0f0;
                border-radius: var(--border-radius);
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
