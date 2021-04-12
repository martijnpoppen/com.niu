const Homey = require('homey');
const { DEVICE_TYPES } = require('../../constants/device_types');

let _devices = [];
let _niuClient = undefined;

module.exports = class mainDriver extends Homey.Driver {
    onInit() {
        this.homey.app.log('[Driver] - init', this.id);
        this.homey.app.log(`[Driver] - version`, Homey.manifest.version);
    }

    deviceType() {
        return DEVICE_TYPES.OTHER
    }

    async onPairListDevices( data, callback ) {
        _niuClient = this.homey.app.getNiuClient();

        _devices = await this.onDeviceListRequest(this.id, _niuClient);

        this.homey.app.log(`[Driver] ${this.id} - Found new devices:`, _devices);
        if(_devices && _devices.length) {
            return _devices;
        } else {
            return new Error('No devices found. Check the login status of this app inside app-settings');
        }
    }


    // ---------------------------------------AUTO COMPLETE HELPERS----------------------------------------------------------
    async onDeviceListRequest(driverId, niuClient) {
        try {
            const deviceList = await niuClient.getVehicles();
            const deviceType = this.deviceType();

            let pairedDriverDevices = [];

            this.homey.app.getDevices().forEach(device => {
                const data = device.getData();
                pairedDriverDevices.push(data.sn);
            })

            this.homey.app.log(`[Driver] ${driverId} - pairedDriverDevices`, pairedDriverDevices);

            const results = deviceList.filter(device => !pairedDriverDevices.includes(device.sn))
                .map((d, i) => ({ 
                    name: d.type, 
                    data: {
                        name: d.type, 
                        index: i, 
                        id: `${d.sn}-${d.frameNo}`, 
                        device_sn: d.sn
                }  
            }));

            this.homey.app.log('Found devices - ', results);
        
            return Promise.resolve( results );
        } catch(e) {
            this.homey.app.log(e);
        }
    }
}