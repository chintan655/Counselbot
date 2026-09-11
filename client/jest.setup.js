import '@testing-library/jest-dom';
jest.mock('jspdf', () => {
  return {
    jsPDF: jest.fn().mockImplementation(() => ({
      addImage: jest.fn(),
      save: jest.fn(),
      setFontSize: jest.fn(),
      text: jest.fn(),
    })),
  };
});
window.HTMLElement.prototype.scrollIntoView = jest.fn();
