() => { const button=document.querySelector('[aria-label="滚动到底部"]'); const visible=!!button;button?.click();return {jumpVisible:visible}; }
