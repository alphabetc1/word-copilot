/**
 * Mock for Office.js API
 */

// Mock Office namespace
export const mockOffice = {
  context: {
    ui: {
      displayDialogAsync: jest.fn(),
    },
    document: {},
  },
  onReady: jest.fn((callback) => {
    callback({ host: "Word", platform: "PC" });
    return Promise.resolve();
  }),
  actions: {
    associate: jest.fn(),
  },
  HostType: {
    Word: "Word",
    Excel: "Excel",
  },
};

// Mock Word namespace
export const mockWord = {
  run: jest.fn(async (callback) => {
    const context = {
      document: {
        getSelection: jest.fn(() => ({
          load: jest.fn(),
          text: "Selected text",
          insertText: jest.fn(),
          delete: jest.fn(),
          getRange: jest.fn(() => ({
            insertComment: jest.fn(),
          })),
          paragraphs: {
            load: jest.fn(),
            items: [{ text: "Paragraph text" }],
          },
        })),
        body: {
          load: jest.fn(),
          text: "Document body text",
          getRange: jest.fn(() => ({
            insertText: jest.fn(),
          })),
        },
        changeTrackingMode: null,
      },
      sync: jest.fn(() => Promise.resolve()),
    };
    return callback(context);
  }),
  InsertLocation: {
    replace: "Replace",
    before: "Before",
    after: "After",
    start: "Start",
    end: "End",
  },
  RangeLocation: {
    start: "Start",
    end: "End",
  },
  ChangeTrackingMode: {
    trackAll: "TrackAll",
  },
};

// Setup global mocks
(globalThis as unknown as Record<string, unknown>).Office = mockOffice;
(globalThis as unknown as Record<string, unknown>).Word = mockWord;
