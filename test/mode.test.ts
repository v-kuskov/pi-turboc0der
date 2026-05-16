jest.mock('fs', () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
}));

jest.mock('path', () => ({
    resolve: jest.fn((...args: string[]) => args.join('/')),
    dirname: jest.fn((p: string) => p.split('/').slice(0, -1).join('/')),
}));

const MOCK_MODE_PATH = '.pi/turboc0der/mode.json';

describe('mode_manager', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(jest.fn());
        jest.spyOn(console, 'warn').mockImplementation(jest.fn());
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.resetModules();
    });

    it('should init with no current mode when state file missing', () => {
        const fs = require('fs');
        const path = require('path');
        path.resolve.mockReturnValue(MOCK_MODE_PATH);
        path.dirname.mockReturnValue('.pi/turboc0der');
        fs.existsSync.mockReturnValue(false);

        const { mode_manager: mgr } = require('../src/mode');
        expect(mgr.get_current_mode()).toBeUndefined();
        expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('should load mode from state file when it exists', () => {
        const fs = require('fs');
        const path = require('path');
        path.resolve.mockReturnValue(MOCK_MODE_PATH);
        path.dirname.mockReturnValue('.pi/turboc0der');
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify({ currentMode: 'plan' }));

        const { mode_manager: mgr } = require('../src/mode');
        expect(fs.readFileSync).toHaveBeenCalledWith(MOCK_MODE_PATH, 'utf8');
        expect(mgr.get_current_mode()?.name()).toBe('plan');
    });

    it('should persist mode on set_mode and return correct mode', () => {
        const fs = require('fs');
        const path = require('path');
        path.resolve.mockReturnValue(MOCK_MODE_PATH);
        path.dirname.mockReturnValue('.pi/turboc0der');
        fs.existsSync.mockReturnValue(true);

        const { mode_manager: mgr } = require('../src/mode');
        const result = mgr.set_mode('build');

        expect(result?.name()).toBe('build');
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            MOCK_MODE_PATH,
            JSON.stringify({ currentMode: 'build' }, null, 2)
        );
    });

    it('should return undefined and not persist for unknown mode', () => {
        const fs = require('fs');
        const path = require('path');
        path.resolve.mockReturnValue(MOCK_MODE_PATH);
        path.dirname.mockReturnValue('.pi/turboc0der');
        fs.existsSync.mockReturnValue(true);

        const { mode_manager: mgr } = require('../src/mode');
        const result = mgr.set_mode('unknown_mode');

        expect(result).toBeUndefined();
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should return correct mode objects for each known mode', () => {
        const fs = require('fs');
        const path = require('path');
        path.resolve.mockReturnValue(MOCK_MODE_PATH);
        path.dirname.mockReturnValue('.pi/turboc0der');
        fs.existsSync.mockReturnValue(true);

        const { mode_manager: mgr, PLAN_MODE, BUILD_MODE, ORCHESTRATOR_MODE } = require('../src/mode');

        expect(mgr.set_mode('plan')?.name()).toBe('plan');
        expect(PLAN_MODE.canRead()).toBe(false);

        expect(mgr.set_mode('build')?.name()).toBe('build');
        expect(BUILD_MODE.canRead()).toBe(true);
        expect(BUILD_MODE.canWrite()).toBe(true);
        expect(BUILD_MODE.canExecute()).toBe(true);

        expect(mgr.set_mode('orchestrator')?.name()).toBe('orchestrator');
        expect(ORCHESTRATOR_MODE.canRead()).toBe(false);
    });
});
