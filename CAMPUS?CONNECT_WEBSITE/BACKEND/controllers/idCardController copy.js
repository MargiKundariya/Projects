const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const IDCard = require("../models/idCardModel");

const generateIDCards = async (req, res) => {
  try {
    const idCardData = req.body;
    const outputDir = path.join(__dirname, "../uploads/idCards");

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load common assets
    const logoPath = path.join(__dirname, "");
    let logo;
    
    try {
      logo = await loadImage(logoPath);
    } catch (err) {
      console.log("Logo not found, will use placeholder instead");
    }

    const generatedCards = [];

    for (const card of idCardData) {
      // Create a new canvas for each ID card
      const canvas = createCanvas(1000, 600); // Wider format for a card-like appearance
      const ctx = canvas.getContext("2d");

      // CARD BASE DESIGN
      // ----------------
      
      // Main background - gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#1a237e"); // Deep blue
      gradient.addColorStop(1, "#283593"); // Slightly lighter blue
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Large watermark logo in background
      if (logo) {
        ctx.globalAlpha = 0.07; // Very subtle watermark
        const logoSize = Math.max(canvas.width, canvas.height) * 1.2;
        const xPos = (canvas.width - logoSize) / 2;
        const yPos = (canvas.height - logoSize) / 2;
        ctx.drawImage(logo, xPos, yPos, logoSize, logoSize);
        ctx.globalAlpha = 1.0;
      }
      
      // Card design elements
      // Decorative corner elements
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      // Top left corner
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(150, 0);
      ctx.lineTo(0, 150);
      ctx.closePath();
      ctx.fill();
      
      // Bottom right corner
      ctx.beginPath();
      ctx.moveTo(canvas.width, canvas.height);
      ctx.lineTo(canvas.width - 150, canvas.height);
      ctx.lineTo(canvas.width, canvas.height - 150);
      ctx.closePath();
      ctx.fill();
      
      // Decorative lines across the card
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 3;
      
      // Horizontal lines
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * (i / 6));
        ctx.lineTo(canvas.width, canvas.height * (i / 6));
        ctx.stroke();
      }
      
      // CONTENT AREAS
      // -------------
      
      // Left section for photo and logo
      const leftWidth = canvas.width * 0.35;
      
      // Add a semi-transparent overlay for the left section
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(0, 0, leftWidth, canvas.height);
      
      // Add visible logo at the top of the left section
      if (logo) {
        ctx.globalAlpha = 1.0;
        const logoWidth = leftWidth * 0.7;
        const logoHeight = logoWidth * (logo.height / logo.width);
        const logoX = (leftWidth - logoWidth) / 2;
        ctx.drawImage(logo, logoX, 30, logoWidth, logoHeight);
      }
      
      // Organization name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.fillText("ORGANIZATION", leftWidth / 2, 150);
      
      // Add user profile picture with stylish frame
      const profileImagePath = card.profileImagePath || path.join(__dirname, "../uploads/default_profile.png");
      try {
        const profileImage = await loadImage(profileImagePath);
        
        // Fancy photo border
        const centerX = leftWidth / 2;
        const centerY = 280;
        const radius = 85;
        
        // Draw glow/shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // Outer decorative ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
        const ringGradient = ctx.createRadialGradient(
          centerX, centerY, radius,
          centerX, centerY, radius + 15
        );
        ringGradient.addColorStop(0, "#ffd700"); // Gold
        ringGradient.addColorStop(1, "#c9b037");
        ctx.fillStyle = ringGradient;
        ctx.fill();
        
        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Inner white border
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        
        // Clip and draw the actual photo
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(profileImage, centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.restore();
        
      } catch (err) {
        console.log("Error loading profile image:", err);
        // Fancy silhouette placeholder
        const centerX = leftWidth / 2;
        const centerY = 280;
        const radius = 85;
        
        // Outer ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd700";
        ctx.fill();
        
        // Inner white border
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        
        // Placeholder background
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#e0e0e0";
        ctx.fill();
        
        // Silhouette
        ctx.fillStyle = "#bdbdbd";
        ctx.beginPath();
        ctx.arc(centerX, centerY - 10, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX - radius * 0.6, centerY + radius * 0.6);
        ctx.quadraticCurveTo(centerX, centerY + radius + 10, centerX + radius * 0.6, centerY + radius * 0.6);
        ctx.fill();
      }
      
      // Add validity year at the bottom of the left section
      const currentYear = new Date().getFullYear();
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(`VALID THRU: ${currentYear + 1}`, leftWidth / 2, canvas.height - 50);
      
      // Right section for details
      const rightSectionX = leftWidth;
      const rightSectionWidth = canvas.width - leftWidth;
      
      // Add a header bar in the right section
      const headerHeight = 80;
      const headerGradient = ctx.createLinearGradient(rightSectionX, 0, canvas.width, 0);
      headerGradient.addColorStop(0, "#3f51b5");
      headerGradient.addColorStop(1, "#5c6bc0");
      ctx.fillStyle = headerGradient;
      ctx.fillRect(rightSectionX, 0, rightSectionWidth, headerHeight);
      
      // ID CARD title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("IDENTITY CARD", rightSectionX + (rightSectionWidth / 2), headerHeight / 2 + 10);
      
      // Content area with light background
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillRect(rightSectionX + 30, headerHeight + 30, rightSectionWidth - 60, canvas.height - headerHeight - 60);
      
      // Name with special styling
      ctx.font = "bold 36px Arial";
      ctx.fillStyle = "#1a237e";
      ctx.textAlign = "center";
      ctx.fillText(card.Name.toUpperCase(), rightSectionX + (rightSectionWidth / 2), headerHeight + 90);
      
      // Fancy underline for name
      const nameUnderlineY = headerHeight + 100;
      const nameUnderlineWidth = 200;
      ctx.beginPath();
      ctx.moveTo(rightSectionX + (rightSectionWidth / 2) - nameUnderlineWidth/2, nameUnderlineY);
      ctx.lineTo(rightSectionX + (rightSectionWidth / 2) + nameUnderlineWidth/2, nameUnderlineY);
      const underlineGradient = ctx.createLinearGradient(
        rightSectionX + (rightSectionWidth / 2) - nameUnderlineWidth/2, nameUnderlineY,
        rightSectionX + (rightSectionWidth / 2) + nameUnderlineWidth/2, nameUnderlineY
      );
      underlineGradient.addColorStop(0, "rgba(26, 35, 126, 0)");
      underlineGradient.addColorStop(0.5, "rgba(26, 35, 126, 1)");
      underlineGradient.addColorStop(1, "rgba(26, 35, 126, 0)");
      ctx.strokeStyle = underlineGradient;
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Info fields with labels and styled containers
      const infoFields = [
        { label: "DEPARTMENT", value: card.Department },
        { label: "EVENT", value: card.EventName || "N/A" },
        { label: "YEAR", value: card.Year || "N/A" },
        { label: "CONTACT", value: card.ContactNo },
        { label: "ID NO", value: card.HeldNo || "N/A" }
      ];
      
      let yPosition = headerHeight + 150;
      const fieldX = rightSectionX + 70;
      const fieldWidth = rightSectionWidth - 140;
      
      infoFields.forEach((field, index) => {
        // Alternate background colors for fields
        ctx.fillStyle = index % 2 === 0 ? "rgba(63, 81, 181, 0.1)" : "rgba(63, 81, 181, 0.03)";
        ctx.fillRect(fieldX, yPosition, fieldWidth, 50);
        
        // Draw label
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "#3f51b5";
        ctx.textAlign = "left";
        ctx.fillText(field.label + ":", fieldX + 20, yPosition + 30);
        
        // Draw value
        ctx.font = "18px Arial";
        ctx.fillStyle = "#212121";
        ctx.fillText(field.value, fieldX + 150, yPosition + 30);
        
        yPosition += 60;
      });
      
      // QR code placeholder (more sophisticated)
      const qrSize = 120;
      const qrX = rightSectionX + rightSectionWidth - qrSize - 70;
      const qrY = canvas.height - qrSize - 70;
      
      // Draw QR code background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      
      // Draw QR code pattern (simplified representation)
      ctx.fillStyle = "#000000";
      const cellSize = qrSize / 25;
      
      // Draw a pattern that resembles a QR code
      for (let i = 0; i < 25; i++) {
        for (let j = 0; j < 25; j++) {
          // Corner squares pattern (fixed for QR codes)
          if ((i < 7 && j < 7) || (i > 17 && j < 7) || (i < 7 && j > 17)) {
            // Draw positioning squares
            if ((i > 1 && i < 5 && j > 1 && j < 5) || 
                (i > 1 && i < 5 && j > 18 && j < 22) || 
                (i > 18 && i < 22 && j > 1 && j < 5)) {
              ctx.fillRect(qrX + i * cellSize, qrY + j * cellSize, cellSize, cellSize);
            }
            // Draw outer positioning patterns
            else if (i === 0 || i === 6 || j === 0 || j === 6 || 
                     i === 18 || i === 24 || j === 18 || j === 24) {
              ctx.fillRect(qrX + i * cellSize, qrY + j * cellSize, cellSize, cellSize);
            }
          } 
          // Random data pattern for the rest (simplified)
          else if (Math.random() > 0.6) {
            ctx.fillRect(qrX + i * cellSize, qrY + j * cellSize, cellSize, cellSize);
          }
        }
      }
      
      // Signature section
      const sigX = rightSectionX + 70;
      const sigY = canvas.height - 100;
      const sigWidth = 200;
      
      ctx.beginPath();
      ctx.moveTo(sigX, sigY);
      ctx.lineTo(sigX + sigWidth, sigY);
      ctx.strokeStyle = "#3f51b5";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#3f51b5";
      ctx.textAlign = "center";
      ctx.fillText("AUTHORIZED SIGNATURE", sigX + sigWidth/2, sigY + 20);
      
      // Add issue date
      ctx.font = "14px Arial";
      ctx.fillStyle = "#616161";
      ctx.textAlign = "left";
      ctx.fillText(`ISSUED: ${new Date().toLocaleDateString()}`, sigX, sigY - 20);
      
      // SECURITY FEATURES
      // ----------------
      
      // Hologram effect circle
      const hologramX = rightSectionX + 100;
      const hologramY = canvas.height - 100;
      const hologramRadius = 30;
      
      const hologramGradient = ctx.createRadialGradient(
        hologramX, hologramY, 0,
        hologramX, hologramY, hologramRadius
      );
      hologramGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      hologramGradient.addColorStop(0.5, "rgba(173, 216, 230, 0.6)");
      hologramGradient.addColorStop(0.7, "rgba(135, 206, 235, 0.5)");
      hologramGradient.addColorStop(1, "rgba(255, 255, 255, 0.7)");
      
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(hologramX, hologramY, hologramRadius, 0, Math.PI * 2);
      ctx.fillStyle = hologramGradient;
      ctx.fill();
      
      // Add crosshatch pattern inside hologram
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      for (let i = -hologramRadius; i <= hologramRadius; i += 5) {
        ctx.moveTo(hologramX - hologramRadius, hologramY + i);
        ctx.lineTo(hologramX + hologramRadius, hologramY + i);
        ctx.moveTo(hologramX + i, hologramY - hologramRadius);
        ctx.lineTo(hologramX + i, hologramY + hologramRadius);
      }
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
      
      // Micro text (security feature) at the bottom
      ctx.font = "7px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      const microText = "SECURITYFEATURE DONOTCOPY SECURITYFEATURE DONOTCOPY SECURITYFEATURE DONOTCOPY ";
      const repeatedText = microText.repeat(5);
      ctx.fillText(repeatedText, 10, canvas.height - 10);
      
      // Small serial number on the corner
      const serialNumber = `SN: ${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.textAlign = "right";
      ctx.fillText(serialNumber, canvas.width - 10, 15);
      
      // Save the card to a file
      const cardFileName = `${card.Name.replace(/\s/g, "_")}_ID.png`;
      const cardPath = path.join(outputDir, cardFileName);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(cardPath, buffer);

      // Save the card details in the database
      const newIDCard = new IDCard({
        name: card.Name,
        department: card.Department,
        eventName: card.EventName || "N/A",
        year: card.Year || "N/A",
        contactNo: card.ContactNo,
        heldNo: card.HeldNo || "N/A",
        filePath: `/uploads/idCards/${cardFileName}`,
      });
      await newIDCard.save();

      // Add to the generated cards array for response
      generatedCards.push({
        name: card.Name,
        filePath: `/uploads/idCards/${cardFileName}`,
      });
    }

    res.status(200).json({
      message: "ID cards generated successfully!",
      idCards: generatedCards,
    });
  } catch (error) {
    console.error("Error generating ID cards:", error);
    res.status(500).json({ message: "Failed to generate ID cards." });
  }
};

// Get an ID Card by name from the session
const getIDCard = async (req, res) => {
  try {
    let sessionName = req.session.name;

    if (!sessionName) {
      console.log("Session name is missing.");
      return res.status(401).json({ message: "Unauthorized: Session name is missing." });
    }

    sessionName = sessionName.trim();

    // Find the ID card using the session's name
    const idCard = await IDCard.find({
      name: { $regex: `^${sessionName}$`, $options: "i" },
    });

    if (!idCard) {
      return res.status(404).json({ message: "ID card not found." });
    }

    res.status(200).json({
      message: "ID card retrieved successfully!",
      idCard,
    });
  } catch (error) {
    console.error("Error fetching ID card:", error);
    res.status(500).json({ message: "Failed to fetch ID card." });
  }
};

module.exports = {
  generateIDCards,
  getIDCard,
};