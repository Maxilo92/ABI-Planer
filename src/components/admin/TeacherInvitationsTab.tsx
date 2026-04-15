'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, query, orderBy, onSnapshot, 
  doc, setDoc, deleteDoc, serverTimestamp, updateDoc
} from 'firebase/firestore'
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Trash2, Printer, FileText, 
  Loader2, CheckCircle2, Clock, Send,
  Sparkles, User, QrCode
} from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { saveAs } from 'file-saver'
import { 
  Document, Packer, Paragraph, TextRun, 
  AlignmentType
} from 'docx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Invitation {
  id: string
  teacherName: string
  salutation: 'Herr' | 'Frau'
  status: 'pending' | 'submitted' | 'expired'
  createdAt: any
}

interface Submission {
  id: string
  invitationId: string
  originalTeacherName: string
  cardName: string
  description: string
  attacks: any[]
  imageUrl: string
  submittedAt: any
  status: 'pending_review' | 'approved' | 'rejected'
}

export function TeacherInvitationsTab() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [newTeacherName, setNewTeacherName] = useState('')
  const [newSalutation, setNewSalutation] = useState<'Herr' | 'Frau'>('Herr')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const qInv = query(collection(db, 'teacher_invitations'), orderBy('createdAt', 'desc'))
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      setInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Invitation[])
      setLoading(false)
    })

    const qSub = query(collection(db, 'teacher_submissions'), orderBy('submittedAt', 'desc'))
    const unsubSub = onSnapshot(qSub, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Submission[])
    })

    return () => { unsubInv(); unsubSub(); }
  }, [])

  const generateInvitation = async () => {
    const trimmedName = newTeacherName.trim()
    if (!trimmedName) {
      toast.error('Bitte geben Sie einen Namen ein')
      return
    }

    // Validation: Require at least two words (First and Last name)
    const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0)
    if (nameParts.length < 2) {
      toast.error('Bitte geben Sie Vor- und Nachnamen ein (z.B. Max Müller)')
      return
    }

    setIsGenerating(true)
    try {
      const token = Math.random().toString(36).substring(2, 10).toUpperCase()
      
      await setDoc(doc(db, 'teacher_invitations', token), {
        teacherName: trimmedName,
        salutation: newSalutation,
        status: 'pending',
        createdAt: serverTimestamp()
      })

      setNewTeacherName('')
      toast.success('Einladung generiert!')
    } catch (error) {
      console.error(error)
      toast.error('Fehler beim Generieren')
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteInvitation = async (id: string) => {
    if (!confirm('Diese Einladung wirklich löschen?')) return
    try {
      await deleteDoc(doc(db, 'teacher_invitations', id))
      toast.success('Gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

  const exportToWord = async (invitation: Invitation) => {
    const url = `https://abi-planer-27.de/lehrer/erstellen/${invitation.id}`
    const nameParts = invitation.teacherName.trim().split(/\s+/)
    const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : invitation.teacherName
    const shortSalutation = invitation.salutation === 'Herr' ? `Sehr geehrter Herr ${lastName}` : `Sehr geehrte Frau ${lastName}`
    
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "ABI PLANER 2027",
                bold: true,
                size: 36,
                color: "3b82f6",
                font: "Inter",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "OFFIZIELLE EINLADUNG",
                bold: true,
                size: 20,
                color: "64748b",
                characterSpacing: 40,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `${shortSalutation},`, bold: true, size: 28, font: "Inter" }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: "wir laden Sie herzlich ein, Teil unseres ABI Planer Sammelkartenspiels zu werden! Als geschätzte Lehrkraft unserer Schule möchten wir Ihnen eine ganz persönliche Sammelkarte widmen.",
                size: 22,
              }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: "Über Ihre persönliche Erstellungsseite können Sie Ihrer Karte einen Namen geben, eine Beschreibung verfassen und eigene 'Attacken' festlegen.",
                size: 22,
              }),
            ],
            spacing: { after: 600 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "SCHRITTE ZUR ERSTELLUNG:", bold: true, size: 20, color: "0f172a" }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({ children: [new TextRun({ text: "1. QR-Code scannen (auf dem gedruckten Brief)", size: 22 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "2. Karte individuell gestalten", size: 22 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "3. Foto hochladen (Optional, 4:3 Format)", size: 22 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "4. Absenden", size: 22 })], spacing: { after: 800 } }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "IHR PERSÖNLICHER ZUGANG", bold: true, size: 20, color: "3b82f6" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: url, color: "3b82f6", underline: {}, size: 18 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Vielen Dank für Ihre Unterstützung!", italics: true, size: 22, color: "64748b" }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `Einladung_${invitation.teacherName.replace(/\s+/g, '_')}.docx`)
  }

  const printLetter = (invitation: Invitation) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const url = `https://abi-planer-27.de/lehrer/erstellen/${invitation.id}`
    
    // Extract last name for personal salutation
    const nameParts = invitation.teacherName.trim().split(/\s+/)
    const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : invitation.teacherName
    const shortSalutation = invitation.salutation === 'Herr' ? `Sehr geehrter Herr ${lastName}` : `Sehr geehrte Frau ${lastName}`
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Einladung - ${invitation.teacherName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            @page { 
              size: A4; 
              margin: 0; 
            }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.5; 
              color: #1a1a1a;
              margin: 0;
              padding: 0;
              background: white;
              -webkit-print-color-adjust: exact;
            }

            .page {
              position: relative;
              width: 210mm;
              height: 297mm;
              padding: 0;
              box-sizing: border-box;
              overflow: hidden;
            }

            .header {
              position: absolute;
              top: 20mm;
              left: 25mm;
              right: 25mm;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }

            .brand-info {
              display: flex;
              align-items: center;
              gap: 4mm;
            }

            .logo { 
              height: 12mm;
              width: auto;
            }

            .brand-details {
              display: flex;
              flex-direction: column;
            }

            .brand-name {
              font-size: 16pt;
              font-weight: 800;
              letter-spacing: -0.01em;
              color: #0f172a;
              margin: 0;
            }

            .brand-tagline {
              font-size: 8pt;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }

            .date-field {
              font-size: 10pt;
              color: #64748b;
              margin-top: 2mm;
            }

            .address-field {
              position: absolute;
              top: 45mm;
              left: 25mm;
              width: 85mm;
              height: 45mm;
              font-size: 10pt;
              color: #1a1a1a;
            }

            .sender-line {
              font-size: 7pt;
              text-decoration: underline;
              color: #94a3b8;
              margin-bottom: 4mm;
            }

            .recipient {
              font-size: 11pt;
              line-height: 1.4;
              margin-top: 10mm;
            }

            .main-content {
              position: absolute;
              top: 85mm;
              left: 25mm;
              right: 25mm;
            }

            .subject {
              font-size: 12pt;
              font-weight: 700;
              margin-bottom: 6mm;
              color: #0f172a;
            }

            .salutation { 
              font-size: 11pt; 
              margin-bottom: 4mm;
            }

            .letter-body {
              font-size: 11pt;
              color: #334155;
              text-align: justify;
            }

            .steps-list {
              margin: 6mm 0;
              padding: 0;
              list-style: none;
            }

            .step {
              margin-bottom: 2mm;
              display: flex;
              gap: 4mm;
            }

            .step-num { 
              font-weight: 700; 
              color: #3b82f6;
              min-width: 6mm;
            }

            .access-section {
              margin-top: 10mm;
              display: flex;
              align-items: flex-start;
              gap: 12mm;
              padding-top: 8mm;
              border-top: 1px solid #f1f5f9;
            }

            .qr-container {
              width: 32mm;
              height: 32mm;
            }

            #qrcode img {
              width: 100% !important;
              height: auto !important;
            }

            .access-details {
              flex: 1;
            }

            .access-label {
              font-size: 8pt;
              font-weight: 700;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 2mm;
            }

            .url-display {
              font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
              font-size: 9pt;
              color: #3b82f6;
              margin-bottom: 3mm;
              word-break: break-all;
            }

            .token-info {
              display: flex;
              flex-direction: column;
              gap: 1mm;
            }

            .token-value {
              font-family: monospace;
              font-size: 14pt;
              font-weight: 700;
              letter-spacing: 0.1em;
              color: #0f172a;
            }

            .closing {
              margin-top: 8mm;
            }

            .footer { 
              position: absolute;
              bottom: 15mm;
              left: 25mm;
              right: 25mm;
              font-size: 8pt; 
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
              padding-top: 4mm;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="brand-info">
                <img src="https://abi-planer-27.de/logo.png" class="logo" />
                <div class="brand-details">
                  <h1 class="brand-name">Abi Planer 2027</h1>
                  <div class="brand-tagline">Exklusives Sammelkartenspiel</div>
                </div>
              </div>
              <div class="date-field">
                ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div class="address-field">
              <div class="sender-line">ABI Planer 2027 • Ein Projekt des Abiturjahrgangs • abi-planer-27.de</div>
              <div class="recipient">
                <strong>An</strong><br />
                ${invitation.salutation} ${invitation.teacherName}<br />
              </div>
            </div>
            
            <div class="main-content">
              <div class="subject">Einladung zur Gestaltung Ihrer persönlichen Sammelkarte</div>

              <div class="salutation">${shortSalutation},</div>
              
              <div class="letter-body">
                <p>wir laden Sie herzlich ein, Teil unseres <strong>ABI Planer Sammelkartenspiels</strong> zu werden! Als geschätzte Lehrkraft unserer Schule möchten wir Ihnen eine ganz persönliche Sammelkarte widmen.</p>
                
                <p>Über den untenstehenden QR-Code oder den direkten Link gelangen Sie zu Ihrer persönlichen Erstellungsseite. Dort können Sie Ihrer Karte einen Namen geben, eine Beschreibung verfassen und eigene "Aktionen" festlegen.</p>
                
                <div class="steps-list">
                  <div class="step"><span class="step-num">1.</span> QR-Code scannen oder Link im Browser öffnen</div>
                  <div class="step"><span class="step-num">2.</span> Karte individuell nach Ihren Wünschen gestalten</div>
                  <div class="step"><span class="step-num">3.</span> Optional: Ein Foto für das Kartendesign hochladen</div>
                  <div class="step"><span class="step-num">4.</span> Daten absenden und Teil des Decks werden</div>
                </div>

                <p>Wir freuen uns sehr über Ihre Teilnahme!</p>
              </div>

              <div class="access-section">
                <div class="qr-container">
                  <div id="qrcode"></div>
                </div>
                <div class="access-details">
                  <div class="access-label">Ihr direkter Link</div>
                  <div class="url-display">${url}</div>
                </div>
              </div>

              <div class="closing">
                Mit freundlichen Grüßen,<br />
                <br />
                <strong>Ihr ABI Planer Team</strong>
              </div>
            </div>
            
            <div class="footer">
              <span>Abi Planer 2027</span>
              <span>Abi Planer 2027 • Gymnasium</span>
              <span>abi-planer-27.de</span>
            </div>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
          <script>
            try {
              var typeNumber = 0; 
              var errorCorrectionLevel = 'M'; 
              var qr = qrcode(typeNumber, errorCorrectionLevel);
              qr.addData('${url}');
              qr.make();
              document.getElementById('qrcode').innerHTML = qr.createImgTag(5, 0);
            } catch(e) { console.error(e); }
            
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 800);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const approveSubmission = async (id: string) => {
    try {
      await updateDoc(doc(db, 'teacher_submissions', id), { status: 'approved' })
      toast.success('Genehmigt!')
    } catch (e) {
      toast.error('Fehler beim Genehmigen')
    }
  }

  const deleteSubmission = async (id: string) => {
    if (!confirm('Diese Einreichung wirklich löschen?')) return
    try {
      await deleteDoc(doc(db, 'teacher_submissions', id))
      toast.success('Gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

  return (
    <Tabs defaultValue="gen" className="w-full">
      <TabsList className="w-fit mb-4">
        <TabsTrigger value="gen" className="gap-2">
          <Plus className="w-3.5 h-3.5" />
          Einladungen
        </TabsTrigger>
        <TabsTrigger value="subs" className="gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Einreichungen ({submissions.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="gen" className="space-y-6">
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Neue Einladung erstellen
            </CardTitle>
            <CardDescription>
              Geben Sie Vor- und Nachname der Lehrkraft ein und wählen Sie die Anrede.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex bg-background border rounded-md p-1">
                <button
                  onClick={() => setNewSalutation('Herr')}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-sm transition-all",
                    newSalutation === 'Herr' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
                  )}
                >
                  Herr
                </button>
                <button
                  onClick={() => setNewSalutation('Frau')}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-sm transition-all",
                    newSalutation === 'Frau' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
                  )}
                >
                  Frau
                </button>
              </div>
              <Input 
                placeholder="Vor- und Nachname (z.B. Max Müller)" 
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateInvitation()}
                className="max-w-md bg-background"
              />
              <Button 
                onClick={generateInvitation} 
                disabled={isGenerating || !newTeacherName.trim()}
                className="gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Generieren
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[300px] font-bold">Lehrkraft</TableHead>
                <TableHead className="w-[120px] font-bold">Code</TableHead>
                <TableHead className="w-[150px] font-bold text-center">Status</TableHead>
                <TableHead className="w-[80px] font-bold text-center">QR</TableHead>
                <TableHead className="text-right font-bold">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv) => (
                <TableRow key={inv.id} className="group transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate">
                          <span className="text-muted-foreground font-normal mr-1">{inv.salutation}</span>
                          {inv.teacherName}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded border">
                      {inv.id}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={inv.status === 'submitted' ? 'default' : 'outline'} 
                      className={cn(
                        "gap-1 whitespace-nowrap",
                        inv.status === 'submitted' ? "bg-emerald-500 hover:bg-emerald-600" : ""
                      )}
                    >
                      {inv.status === 'submitted' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Eingereicht</span>
                          <span className="sm:hidden">OK</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span className="hidden sm:inline">Ausstehend</span>
                          <span className="sm:hidden">Offen</span>
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-fit p-3" align="center">
                        <div className="bg-white p-2 rounded-lg border shadow-sm">
                          <QRCodeSVG value={`https://abi-planer-27.de/lehrer/erstellen/${inv.id}`} size={120} />
                        </div>
                        <p className="text-[10px] text-center mt-2 font-mono text-muted-foreground">
                          {inv.id}
                        </p>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-2 text-xs"
                        onClick={() => printLetter(inv)}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Drucken</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-2 text-xs"
                        onClick={() => exportToWord(inv)}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Word</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteInvitation(inv.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {!loading && invitations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Plus className="w-8 h-8" />
                      <p>Noch keine Einladungen erstellt.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="subs" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map((sub) => (
            <Card key={sub.id} className="overflow-hidden border-2">
              <CardHeader className="bg-muted/30">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{sub.cardName}</CardTitle>
                    <CardDescription className="text-xs">Original: {sub.originalTeacherName}</CardDescription>
                  </div>
                  <Badge variant={sub.status === 'approved' ? 'default' : 'secondary'}>
                    {sub.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {sub.imageUrl && (
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border">
                    <img src={sub.imageUrl} className="w-full h-full object-cover" alt={sub.cardName} />
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm italic font-medium">"{sub.description}"</p>
                  <div className="space-y-1">
                    {sub.attacks.map((a, i) => (
                      <div key={i} className="text-xs p-2 bg-muted rounded">
                        <span className="font-bold">{a.name}</span>: {a.description}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant={sub.status === 'approved' ? 'outline' : 'default'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => approveSubmission(sub.id)}
                    disabled={sub.status === 'approved'}
                  >
                    Genehmigen
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive"
                    onClick={() => deleteSubmission(sub.id)}
                  >
                    Löschen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {!loading && submissions.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl opacity-20">
              <Sparkles className="w-12 h-12 mx-auto mb-2" />
              <p>Noch keine Einreichungen eingegangen.</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
