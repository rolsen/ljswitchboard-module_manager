/* jshint undef: true, unused: true, undef: true */
/* global console, module_manager, dict, q, showAlert, modbus_map, $ */
/* global ljmmm_parse, handlebars */

/* global dataTableCreator */
/* exported activeModule, module, MODULE_UPDATE_PERIOD_MS */

/**
 * Goals for the Register Matrix module:
**/

// Constant that determines device polling rate.  Use an increased rate to aid
// in user experience.
var MODULE_UPDATE_PERIOD_MS = 1000;

/**
 * Module object that gets automatically instantiated & linked to the appropriate framework.
 * When using the 'singleDevice' framework it is instantiated as sdModule.
 */
function module() {
    this.moduleConstants = {};

    this.startupData = {};
    this.moduleName = '';
    this.moduleContext = {};
    this.activeDevice = undefined;




    /**
     * Function is called once every time the module tab is selected, loads the module.
     * @param  {[type]} framework   The active framework instance.
     * @param  {[type]} onError     Function to be called if an error occurs.
     * @param  {[type]} onSuccess   Function to be called when complete.
    **/
    this.onModuleLoaded = function(framework, onError, onSuccess) {
        self.startupData = framework.moduleData.startupData;
        self.moduleName = framework.moduleData.name;

        onSuccess();
    };

    /**
     * Function is called once every time a user selects a new device.  
     * @param  {[type]} framework   The active framework instance.
     * @param  {[type]} device      The active framework instance.
     * @param  {[type]} onError     Function to be called if an error occurs.
     * @param  {[type]} onSuccess   Function to be called when complete.
    **/
    this.onDeviceSelected = function(framework, device, onError, onSuccess) {
        self.activeDevices = device;
        framework.clearConfigBindings();
        framework.setStartupMessage('Reading Device Configuration');
        
        onSuccess();
    };


    this.onDeviceConfigured = function(framework, device, setupBindings, onError, onSuccess) {

        // self.getRegistersToDisplay()
        // .then(self.getRegistersModbusInfo)
        // .then(self.cachedRegistersToDisplay)
        // .then(self.getInitialDeviceData)
        // .then(function(registers) {
        //     console.log('Registers to display:', registers);
        //     self.moduleContext = {
        //         'activeRegisters': self.getActiveRegistersData(registers)
        //     };
        //     framework.setCustomContext(self.moduleContext);
        //     onSuccess();
        // });
        // framework.setCustomContext(self.moduleContext);
        onSuccess();
    };

    this.onTemplateLoaded = function(framework, onError, onSuccess) {
        onSuccess();
    };

    this.hideSaveButtons = function() {
        var defered = q.defer();

        // $('#saved-indicator').hide();
        $('#configure-button').slideUp();
        $('#saving-indicator').slideDown();
        defered.resolve();
        return defered.promise;
    };
    var TARGET_REGISTER = {
        factory: 'IO_CONFIG_SET_DEFAULT_TO_FACTORY',
        current: 'IO_CONFIG_SET_DEFAULT_TO_CURRENT'
    };
    var configureDeviceStrategies = {
        factory: function(device) {
            // Write a 1 to the appropriate register.
            return device.iWrite(TARGET_REGISTER.factory, 1);
        },
        current: function(device) {
            // Write a 1 to the appropriate register.
            return device.iWrite(TARGET_REGISTER.current, 1);
        }
    };
    this.configureSelectedDevice = function(device) {
        try {
            var selectedOption = $('.radio input:checked');
            var selectedVal = selectedOption.val();
            return configureDeviceStrategies[selectedVal](device);
        } catch(err) {
            console.error('Error writing to device', err);
        }
    };
    this.configureSelectedDevices = function() {
        var defered = q.defer();
        var promises = self.activeDevices.map(self.configureSelectedDevice);
        q.allSettled(promises)
        .then(function() {
            defered.resolve();
        });
        return defered.promise;
    };
    this.showSaveButtons = function() {
        var defered = q.defer();
        $('#saving-indicator').slideUp();
        // $('#saved-indicator').slideDown();
        $('#configure-button').slideDown();
        defered.resolve();
        return defered.promise;
    };
    this.attachListener = function() {
        var defered = q.defer();
        var buttonEle = $('#configure-button');
        // buttonEle.off('click');
        buttonEle.one('click', self.configureDevice);
        defered.resolve();
        return defered.promise;
    };
    this.configureDevice = function() {

        self.hideSaveButtons()
        .then(self.configureSelectedDevices)
        .then(self.showSaveButtons)
        .then(self.attachListener);
    };

    /**
     * Function that gets executed after the module's template is displayed.
     * @param  {object} framework framework object.
     * @param  {function} onError   function to be called on error.
     * @param  {function} onSuccess function to be called on success
     * @return {[type]}           [description]
     */
    this.onTemplateDisplayed = function(framework, onError, onSuccess) {
        self.attachListener()
        .then(onSuccess);
    };
    this.onRegisterWrite = function(framework, binding, value, onError, onSuccess) {
        onSuccess();
    };
    this.onRegisterWritten = function(framework, registerName, value, onError, onSuccess) {
        onSuccess();
    };
    this.onRefresh = function(framework, registerNames, onError, onSuccess) {
        onSuccess();
    };
    this.onRefreshed = function(framework, results, onError, onSuccess) {
        onSuccess();
    };
    this.onCloseDevice = function(framework, device, onError, onSuccess) {
        var buttonEle = $('#configure-button');
        buttonEle.off('click');
        onSuccess();
    };
    this.onUnloadModule = function(framework, onError, onSuccess) {
        onSuccess();
    };
    this.onLoadError = function(framework, description, onHandle) {
        console.log('in onLoadError', description);
        onHandle(true);
    };
    this.onWriteError = function(framework, registerName, value, description, onHandle) {
        console.log('in onConfigError', description);
        onHandle(true);
    };
    this.onRefreshError = function(framework, registerNames, description, onHandle) {
        console.log('in onRefreshError', description);
        onHandle(true);
    };

    var self = this;
}
