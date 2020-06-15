<template>
  <section>
    <!-- key form -->
    <el-dialog
      title="服务绑定"
      :visible.sync="keyDialogVisible"
      class="dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="keyForm" :rules="keyFormRules" ref="keyForm">
        <el-form-item label="序列号" label-width="100px" prop="number">
          <el-input v-model="keyForm.number" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="keyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitKeyForm('keyForm')">确定</el-button>
      </div>
    </el-dialog>

    <!-- auth form -->
    <el-dialog
      title="连接认证"
      :visible.sync="authDialogVisible"
      class="dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="authForm" :rules="authFormRules" ref="authForm">
        <el-form-item label="房间号" label-width="100px" prop="room">
          <el-input v-model="authForm.room" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="身份证号" label-width="100px" prop="id">
          <el-input v-model="authForm.id" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="authDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAuthForm('authForm')">确定</el-button>
      </div>
    </el-dialog>

    <el-container>
      <el-header class="toolbar">
        <h1 class="toolbar-title" v-if="this.userInfo">正在控制 {{ this.userInfo.room }} 房间</h1>
        <h1 class="toolbar-title" v-if="!this.userInfo">未登录</h1>
        <div class="toolbar-buttons">
          <el-button v-if="this.userInfo" type="danger" @click="quit()">退出登录</el-button>
          <el-button icon="el-icon-user" type="primary" @click="authDialogVisible = true">登录</el-button>
          <el-button icon="el-icon-setting" type="info" @click="keyDialogVisible = true">配置证书</el-button>
        </div>
      </el-header>
    </el-container>

    <div class="panel" v-loading="this.loading" :element-loading-text="this.loadingText">
      <section v-if="this.loading">
        <div style="height:60vh" />
      </section>

      <section v-if="!this.loading">
        <el-divider content-position="left">主控状态</el-divider>
        <el-row>
          <el-col :span="24">
            <div class="status-card-item">
              <span type="primary">{{ this.masterSettings.mode == "cold" ? "制冷" : "制热" }}</span>
              <el-tag type="primary">当前模式</el-tag>
            </div>
            <div class="status-card-item">
              <span
                type="success"
              >{{ this.masterSettings.min_temperature }} ~ {{ this.masterSettings.max_temperature }}</span>
              <el-tag type="success">温度范围</el-tag>
            </div>
          </el-col>
        </el-row>

        <el-divider content-position="left">从控信息与设置</el-divider>
        <el-row>
          <el-col :span="12">
            <div style="margin-bottom:20px">
              <el-switch
                type="primary"
                v-model="pendingSettings.on"
                active-text="启用空调"
                inactive-text="关闭空调"
                @change="handleSettingsChange()"
              ></el-switch>
            </div>
          </el-col>
          <el-col :span="12">
            <span type="primary">{{ currentSettings.on ? " 开机" : " 关机" }}</span>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="12">
            <el-card class="status-card">
              <div slot="header" class="clearfix">
                <span>温度信息</span>
              </div>

              <div class="status-card-item">
                <span type="primary">{{ this.currentSettings.temperature }}</span>
                <el-tag type="primary">当前设定温度</el-tag>
              </div>

              <div class="status-card-item">
                <span
                  type="success"
                >{{ this.enviromentTemperature ? this.enviromentTemperature.toFixed(2) : "N/A" }}</span>
                <el-tag type="success">当前温度</el-tag>
              </div>
              <div class="status-card-item">
                <span
                  type="success"
                >{{ this.ambientTemperature ? this.ambientTemperature.toFixed(2) : "N/A" }}</span>
                <el-tag type="success">环境温度</el-tag>
              </div>

              <div class="splitter"></div>
              <div class="splitter"></div>
              <div class="splitter"></div>

              <div class="status-card-item">
                <el-slider
                  v-if="currentSettings.on"
                  v-model="pendingSettings.temperature"
                  :step="1"
                  :min="masterSettings.min_temperature"
                  :max="masterSettings.max_temperature"
                  @change="handleSettingsChange()"
                ></el-slider>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="status-card">
              <div slot="header" class="clearfix">
                <span>风速信息</span>
              </div>

              <div class="status-card-item">
                <span type="success">{{ this.currentSettings.speed }}</span>
                <el-tag type="success">当前风速</el-tag>
              </div>

              <div class="splitter"></div>
              <div class="splitter"></div>
              <div class="splitter"></div>

              <div class="status-card-item">
                <el-slider
                  v-if="currentSettings.on"
                  v-model="pendingSettings.speed"
                  :step="1"
                  :min="0"
                  :max="3"
                  show-stops
                  @change="handleSettingsChange()"
                ></el-slider>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-divider content-position="left">计费信息</el-divider>

            <div class="status-card-item">
              <span type="success">{{ this.stats.fee ? this.stats.fee.toFixed(2) : 0 }} 元</span>
              <el-tag type="success">当前费用</el-tag>
            </div>

            <div class="status-card-item">
              <span type="primary">{{ this.stats.energy ? this.stats.energy.toFixed(2) : 0 }} 千瓦时</span>
              <el-tag type="primary">消耗电量</el-tag>
            </div>
          </el-col>
        </el-row>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Settings, Stats, MasterSettings, Events, UserInfo } from "../model";
import _ from "lodash";

import eventBus from "../main";
// import enviromentSim from "../enviroment-sim";
import service from "../service";
import acSelector from "../air-conditioner";
import { ElForm } from "element-ui/types/form";

let ac: any;

@Component
export default class ControlPanel extends Vue {
  async quit() {
    let res = await service.disconnect();

    if (!res.error) {
      this.$data.loading = true;
      this.$data.loadingText = "正在退出";
      setTimeout(() => {
        window.history.go();
      }, 100);
    }
  }

  async mounted() {
    ac = await acSelector();
    ac.setSettings(this.$data.currentSettings);
    // enviromentSim.setSettings(this.$data.currentSettings);

    eventBus.$on(Events.onStatsUpdate, (stats: Stats) => {
      this.$data.stats = stats;
    });

    let hasStop = false;

    eventBus.$on(
      Events.onEnviromentUpdate,
      async (enviromentTemperature: number, ambientTemperature: number) => {
        Object.assign(this.$data, {
          enviromentTemperature,
          ambientTemperature
        });

        let offset =
          enviromentTemperature - this.$data.currentSettings.temperature;

        if (this.$data.userInfo && Math.abs(offset) < 0.1) {
          if (!hasStop) {
            await service.stop();
          }
        } else {
          hasStop = false;
        }

        if (this.$data.masterSettings.mode == "warm") {
          offset = -offset;
        }

        if (this.$data.userInfo && offset > 1) {
          this.handleSettingsChange();
        }
      }
    );

    eventBus.$on(Events.onSpeedUpdate, (speed: number) => {
      this.$data.currentSettings.speed = speed;
    });

    // this.$on("test", () => {
    //   console.log("test event!");
    // });
    // this.$emit("test");

    // eventBus.$emit(Events.onStatsUpdate);
  }

  showSuccess(message: string) {
    this.$message.success({
      message: message,
      offset: 80
    });
    console.log(message);
  }

  showError(message: string) {
    this.$message.error({
      message: message,
      offset: 80
    });
    console.error(message);
  }

  lastSettingsUpdate = -1;

  async handleSettingsChange() {
    let currentSettingsChange = Date.now();

    /** only one request per sec */
    setTimeout(async () => {
      /** Cancel if last request earlier than this */
      if (currentSettingsChange > this.lastSettingsUpdate) {
        this.lastSettingsUpdate = Date.now();
        let res = await service.setSettings(this.$data.pendingSettings);
        if (res.error) {
          this.$data.pendingSettings = _.cloneDeep(this.$data.currentSettings);
          this.showError(res.message);
        } else if (res.data) {
          let ns = _.cloneDeep(this.$data.pendingSettings);
          ns.speed = this.$data.currentSettings.speed;
          this.$data.currentSettings = ns;
          ac.setSettings(this.$data.currentSettings);
          // this.showSuccess(res.message);
        }
      }
    }, 1000);
  }

  async submitKeyForm(formRef: string) {
    let valid = await (this.$refs[formRef] as ElForm).validate();
    if (valid) {
      window.localStorage.setItem("app_key", this.$data.keyForm.number);
      this.$data.keyDialogVisible = false;
      this.showSuccess("成功输入 APP_KEY");
    } else {
      this.showError("输入 APP_KEY 格式错误，请重新输入");
    }
  }

  async submitAuthForm(formRef: string) {
    let valid = await (this.$refs[formRef] as ElForm).validate();
    if (valid) {
      this.$data.loading = true;

      const res = await service.login(this.$data.authForm);
      if (res.error) {
        this.showError(res.message);
      } else {
        this.$data.authDialogVisible = false;
        this.$data.userInfo = res.data;
        this.$data.loading = false;
        this.showSuccess(res.message);

        {
          this.$data.loadingText = "正在获取主控信息";

          let res = await service.getMasterSettings();
          console.log("[MASTER]", res);
          if (res.error) {
            this.showError(res.message);
          } else {
            this.$data.loading = false;
            this.$data.masterSettings = res.data;
            this.showSuccess(res.message);
          }

          this.$data.currentSettings.temperature = this.$data.masterSettings.default_temperature;
          this.$data.pendingSettings.temperature = this.$data.masterSettings.default_temperature;
        }

        {
          let res = await service.setSettings(this.$data.pendingSettings);
          if (res.error) {
            this.showError(res.message);
          } else if (res.data) {
            this.$data.loading = false;
            this.$data.currentSettings = res.data;
            this.showSuccess(res.message);
          }
        }
      }
    }
  }

  data() {
    const keyForm: object = {
      number: null
    };
    const keyFormRules: object = {
      number: [{ required: true, message: "请输入序列号", trigger: "blur" }]
    };
    const authForm: object = {
      room: null,
      id: null
    };
    const authFormRules: object = {
      room: [{ required: true, message: "请输入房间号", trigger: "blur" }],
      id: [
        { required: true, message: "请输入身份证号", trigger: "blur" }
        // {
        //   pattern: /^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/,
        //   message: "身份证号码格式有误",
        //   trigger: "blur"
        // }
      ]
    };

    let settings: Settings = {
      on: false,
      temperature: 26,
      speed: 0
    };
    let data = {
      login: false,
      keyForm: keyForm,
      keyFormRules: keyFormRules,
      keyDialogVisible: false,
      authForm: authForm,
      authFormRules: authFormRules,
      authDialogVisible: true,
      loading: true,
      loadingText: "等待登录中",
      enviromentTemperature: -1, //enviromentSim.getEnviromenttemperature(),
      ambientTemperature: -1,
      currentSettings: settings,
      pendingSettings: _.cloneDeep(settings),
      stats: {
        energy: 5.6,
        fee: 2.1
      } as Stats,
      userInfo: null,
      masterSettings: {
        mode: "cold",
        min_temperature: 16,
        max_temperature: 26
      } as MasterSettings
    };

    let res: {
      loading: boolean;
      loadingText: string;
      currentSettings: Settings;
      enviromentTemperature: number;
      ambientTemperature: number;
      pendingSettings: Settings;
      userInfo: UserInfo | null;
      stats: Stats;
      masterSettings: MasterSettings;
    } = data;

    return res;
  }
}
</script>

<style>
.splitter {
  height: 10px;
}
.status-card {
  /*  min-height: 50vh; */
}

.dialog {
  /* width: 80vmin; */
}

.el-card__body {
  height: 100%;
  /* min-height: 100% !important; */
}

.status-card-item {
  overflow: hidden;
  padding: 5px 10px;
}

.panel {
  width: 60vw;
  max-width: 600px;
  min-width: 95vmin;
  margin: auto;
  padding: 0 20px;
}

.el-col {
  padding: 0px 10px;
}
.el-tag {
  float: right;
}

.el-slider {
  float: bottom;
}

.toolbar-title {
  color: white;
  line-height: 60px;
  display: inline;
}

.toolbar {
  background-color: #444444;
  width: auto;
}

.toolbar-buttons {
  width: 40vw;
  height: 100%;
  float: right;
  display: flex;
  justify-content: flex-end;
}

.toolbar-buttons > .el-button {
  height: 40px;
  align-self: center;
}
</style>
