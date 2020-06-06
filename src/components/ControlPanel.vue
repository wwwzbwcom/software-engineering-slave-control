<template>
  <div class="panel" v-loading="this.loading" element-loading-text="this.loadingText">
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
          >{{ this.masterSettings.min_tempareture }} ~ {{ this.masterSettings.max_tempareture }}</span>
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
          ></el-switch>
        </div>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="12">
        <el-card class="status-card">
          <div slot="header" class="clearfix">
            <span>温度信息</span>
          </div>

          <div class="status-card-item">
            <span type="primary">{{ this.settings.tempareture }}</span>
            <el-tag type="primary">当前设定温度</el-tag>
          </div>

          <div class="status-card-item">
            <span type="success">{{ this.enviromentTempareture.toFixed(2) }}</span>
            <el-tag type="success">环境温度</el-tag>
          </div>

          <div class="splitter"></div>
          <div class="splitter"></div>
          <div class="splitter"></div>

          <div class="status-card-item">
            <el-slider v-model="pendingSettings.tempareture" :step="1" :min="16" :max="31"></el-slider>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="status-card">
          <div slot="header" class="clearfix">
            <span>风速信息</span>
          </div>

          <div class="status-card-item">
            <span type="success">{{ this.settings.speed }} 级</span>
            <el-tag type="success">当前风速</el-tag>
          </div>

          <div class="splitter"></div>
          <div class="splitter"></div>
          <div class="splitter"></div>

          <div class="status-card-item">
            <el-slider v-model="pendingSettings.speed" :step="1" :min="1" :max="5" show-stops></el-slider>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-divider content-position="left">计费信息</el-divider>

        <div class="status-card-item">
          <span type="success">{{ this.stats.fee.toFixed(2) }} 元</span>
          <el-tag type="success">当前费用</el-tag>
        </div>

        <div class="status-card-item">
          <span type="primary">{{ this.stats.total_fee.toFixed(2) }} 元</span>
          <el-tag type="primary">入住累计费用</el-tag>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Settings, Stats, MasterSettings, Event } from "../model";
import eventBus from "../main";
import enviromentSim from "../enviroment-sim";
import service from "../service";

@Component
export default class ControlPanel extends Vue {
  async mounted() {
    enviromentSim.setSettings(this.$data.settings);

    let res = await service.getMasterSettings();

    if (res.message) {
      this.showError(res.message);
    } else if (res.data) {
      Object.assign(this.$data.masterSettings, res.data);
    }

    eventBus.$on(Event.onStatsUpdate, (stats: Stats) => {
      console.log("[On]", Event.onStatsUpdate, stats);
      Object.assign(this.$data.stats, stats);
    });

    eventBus.$on(Event.onEnviromentUpdate, (enviromentTempareture: number) => {
      console.log("[On]", Event.onEnviromentUpdate, enviromentTempareture);
      this.$data.enviromentTempareture = enviromentTempareture;
    });

    this.$on("test", () => {
      console.log("test event!");
    });
    this.$emit("test");

    eventBus.$emit(Event.onStatsUpdate);
  }

  showError(message: string) {
      console.error(message);
  }

  lastSettingsUpdate = -1;

  async handleSettingsChange() {
    let currentSettingsChange = Date.now();

    /** only one request per sec */
    setTimeout(async () => {
      if (currentSettingsChange > this.lastSettingsUpdate) {
        this.lastSettingsUpdate = Date.now();
        let res = await service.setSettings(this.$data.pendingSettings);
        if (res.message) {
          this.showError(res.message);
        } else if (res.data) {
          res.data;
        }
      }
    }, 1000);
  }

  data() {
    let settings: Settings = {
      on: true,
      tempareture: 26,
      speed: 3
    };
    let data = {
      loading: false,
      loadingText: "",
      enviromentTempareture: enviromentSim.getEnviromentTempareture(),
      settings: settings,
      pendingSettings: settings,
      stats: {
        total_fee: 5.6,
        fee: 2.1
      },
      masterSettings: {
        mode: "cold",
        min_tempareture: 16,
        max_tempareture: 26
      } as MasterSettings
    };

    data.pendingSettings = data.settings;

    let res: {
      loading: boolean;
      loadingText: string;
      settings: Settings;
      enviromentTempareture: number;
      pendingSettings: Settings;
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
</style>
