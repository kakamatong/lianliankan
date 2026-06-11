import { SprotoUserEnergy, SprotoUserEnergyChange } from "../../types/protocol/lobby/c2s";
import { DataCenter } from "@datacenter/Datacenter";
import { DispatchEvent } from "@frameworks/Framework";
import { EVENT_NAMES } from "@datacenter/CommonConfig";
import { BaseModule } from "@frameworks/base/BaseModule";

export class UserEnergy extends BaseModule {
    static get instance(): UserEnergy {
        return this._getInstance<UserEnergy>(UserEnergy);
    }

    req() {
        this.reqLobby(SprotoUserEnergy, {}, this.resp.bind(this));
    }

    resp(data: SprotoUserEnergy.Response) {
        if (data) {
            DataCenter.instance.userEnergy = data;
            DispatchEvent(EVENT_NAMES.USER_ENERGY, data);
        }
    }

    changeReq(change: number) {
        this.reqLobby(SprotoUserEnergyChange, { change }, this.changeResp.bind(this));
    }

    changeResp(data: SprotoUserEnergyChange.Response) {
        if (data && data.code === 1) {
            DataCenter.instance.userEnergy = data;
            DispatchEvent(EVENT_NAMES.USER_ENERGY, data);
        }
    }
}
