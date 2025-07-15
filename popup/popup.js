// MindShield popup script
document.addEventListener("DOMContentLoaded", async () => {
  // Get elements
  const statusIcon = document.getElementById("status-icon");
  const statusText = document.getElementById("status-text");
  const blockedCount = document.getElementById("blocked-count");
  const blockCounter = document.getElementById("block-counter");
  const lastUpdate = document.getElementById("last-update");
  const updateBtn = document.getElementById("update-btn");
  const refreshConfigBtn = document.getElementById("refresh-config-btn");

  // Update UI with data from background script
  await updateStats();

  // Add event listener for update button
  updateBtn.addEventListener("click", async () => {
    updateBtn.textContent = "Updating...";
    updateBtn.disabled = true;

    try {
      // Send message to background script to update block lists
      await chrome.runtime.sendMessage({ action: "updateBlocklists" });
      await updateStats();
    } catch (error) {
      console.error("Failed to update block lists:", error);
    } finally {
      updateBtn.textContent = "Update Block Lists";
      updateBtn.disabled = false;
    }
  });

  // Add event listener for refresh config button
  refreshConfigBtn.addEventListener("click", async () => {
    refreshConfigBtn.textContent = "Refreshing...";
    refreshConfigBtn.disabled = true;

    try {
      // Send message to background script to refresh configuration from GitHub
      await chrome.runtime.sendMessage({ action: "refreshConfig" });
      await updateStats();
    } catch (error) {
      console.error("Failed to refresh configuration:", error);
    } finally {
      refreshConfigBtn.textContent = "Refresh Config";
      refreshConfigBtn.disabled = false;
    }
  });

  // Function to update stats in UI
  async function updateStats() {
    try {
      // Get data from storage
      const data = await chrome.storage.local.get([
        "blockedDomains",
        "lastUpdate",
        "enabled",
        "blockCounter",
      ]);

      // Update blocked count (number of block rules)
      if (data.blockedDomains) {
        blockedCount.textContent = data.blockedDomains.length.toLocaleString();
      } else {
        blockedCount.textContent = "0";
      }

      // Update block counter
      if (data.blockCounter) {
        blockCounter.textContent = data.blockCounter.toLocaleString();
      } else {
        blockCounter.textContent = "0";
      }

      // Update last update timestamp with better formatting
      if (data.lastUpdate) {
        const date = new Date(data.lastUpdate);
        // Format: "June 15, 2:45 PM"
        const options = {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        };
        lastUpdate.textContent = date.toLocaleString(undefined, options);
      } else {
        lastUpdate.textContent = "Never";
      }

      // Update status indicator
      if (data.enabled === false) {
        statusIcon.textContent = "⚠️";
        statusText.textContent = "Protection Inactive";
        document.querySelector(".status-indicator").classList.add("inactive");
      } else {
        statusIcon.textContent = "⚡";
        statusText.textContent = "Protection Active";
        document
          .querySelector(".status-indicator")
          .classList.remove("inactive");
      }
    } catch (error) {
      console.error("Failed to update stats:", error);
    }
  }
});
