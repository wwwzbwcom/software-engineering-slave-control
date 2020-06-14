<template>
  <div id="app">
    <!-- <el-container>
    <el-header class="toolbar">
      <h1 class="toolbar-title">正在控制 507 房间</h1>
      <div class="toolbar-buttons">
      <el-button icon="el-icon-cloudy" type="primary">远程控制</el-button>
      <el-button  icon="el-icon-setting" type="info">配置证书</el-button>
      </div>
    </el-header >
    </el-container> -->
    <ControlPanel></ControlPanel>
  </div>
</template>

<script>
import ControlPanel from './components/ControlPanel.vue'

export default {
  name: 'app',
  components: {
    ControlPanel
  }
}
</script>

<style>

body {
  margin: 0;
}


#app {
  font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
