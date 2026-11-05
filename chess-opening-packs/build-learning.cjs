// Authoring source. Regenerates main-families.json; paths resolve from this file, so run it from anywhere.
const fs=require('fs'),path=require('path');
const catalogue=JSON.parse(fs.readFileSync(path.join(__dirname,'lichess-catalogue.json'),'utf8'));
const lessons=[];
function lesson(id,name,group,family,line,ply,idea,whitePlan,blackPlan,watch,prompt,explanation){
  const movesSan=line.split(' ');
  const source=catalogue.openings.filter(e=>movesSan.every((m,i)=>m===e.movesSan[i])).sort((a,b)=>a.movesSan.length-b.movesSan.length)[0];
  if(!source)throw Error('No catalogue reference for '+name+': '+line);
  const classification=catalogue.openings.filter(e=>e.movesSan.every((m,i)=>m===movesSan[i])).sort((a,b)=>b.movesSan.length-a.movesSan.length)[0] || source;
  lessons.push({id:'learn-'+id,nameEn:name,group,family,movesSan,eco:classification.eco,sideToMove:movesSan.length%2?'black':'white',verified:false,tag:'lesson',idea,whitePlan,blackPlan,watch,
    sourceField:'https://github.com/lichess-org/chess-openings/blob/'+catalogue.revision+'/'+source.eco[0].toLowerCase()+'.tsv',
    positions:[{id:'key-idea',title:name+': key idea',ply,prompt,explanation}]});
}
lesson('italian','Italian Game','Open games','Italian Game','e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3',6,
 'Develop the bishop toward f7 and prepare a supported central pawn break.',
 'Castle, support e4, and prepare d4 when your pieces can use the opened centre.',
 'Develop actively, secure the king, and contest the centre with a well-timed ...d5.',
 'An attack on f7 needs concrete support; the bishop alone does not win the pawn.',
 'Prepare to support a later d4 advance.', 'c3 supports d4. In this quiet line White then uses d3 to secure e4 before opening the centre.');
lesson('ruy','Ruy Lopez','Open games','Ruy Lopez','e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O',8,
 'Pressure the knight that defends e5, then build central pressure while developing.',
 'Secure the king and support e4 before preparing c3 and d4 in the closed structures.',
 'Develop, defend the centre, and choose when to challenge the bishop or release central tension.',
 'Bxc6 followed by Nxe5 does not automatically win a pawn; Black has tactical resources.',
 'Your bishop has retreated and Black has developed. Secure your king.', 'O-O castles and activates the rook. White can now reinforce the centre instead of starting an unsupported attack.');
lesson('scotch','Scotch Game','Open games','Scotch Game','e4 e5 Nf3 Nc6 d4 exd4 Nxd4',4,
 'Open the centre early and use active piece development.',
 'Recapture on d4 with a piece, develop the remaining pieces, and castle.',
 'Use the open lines to develop quickly and put pressure on e4.',
 'Repeated moves by the central knight can let the opponent catch up in development.',
 'Challenge e5 directly with a central pawn.', 'd4 opens the centre. After ...exd4, Nxd4 places the knight actively while recovering the pawn.');
lesson('petroff','Petroff Defence','Open games',"Petrov's Defense",'e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4',5,
 'Black attacks e4 instead of immediately defending e5.',
 'Use central space and natural development to test Black without assuming the symmetry means a draw.',
 'Challenge the advanced knight before recovering the pawn, then support the centre.',
 'Immediate ...Nxe4 after Nxe5 allows Qe2 with awkward threats.',
 'Drive the e5 knight away before recovering the e4 pawn.', 'd6 attacks Ne5. After Nf3, ...Nxe4 recovers the pawn in this standard move order.');
lesson('philidor','Philidor Defence','Open games','Philidor Defense','e4 e5 Nf3 d6 d4 exd4 Nxd4',4,
 'Black uses a pawn to hold e5, accepting less space for a solid centre.',
 'Claim space with d4 and develop into the centre before launching an attack.',
 'Complete development and seek a freeing central break when prepared.',
 'A compact setup needs active development; defending everything passively leaves little room.',
 'Take more central space while challenging e5.', 'd4 attacks e5. The exchange shown here opens lines and lets White recapture with the knight.');
lesson('vienna','Vienna Game','Open games','Vienna Game','e4 e5 Nc3 Nf6 Bc4',4,
 'White develops the queenside knight first and keeps several central setups available.',
 'Develop, secure the king, and choose between a quiet centre and a prepared f4 advance.',
 'Meet White with natural development and look for a well-supported ...d5 break.',
 'The f-pawn advance changes king safety; do not play it automatically in every Vienna position.',
 'Develop the light bishop toward f7 in this quiet Vienna line.', 'Bc4 develops with pressure toward f7. White retains choices about the central pawns rather than committing immediately to a gambit.');
lesson('four-knights','Four Knights Game','Open games','Four Knights Game','e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5',4,
 'Both sides develop their knights before choosing a bishop setup or central break.',
 'Coordinate development, then use d4 or bishop pressure to influence the centre.',
 'Keep developing and answer central threats before copying White automatically.',
 'Symmetry does not make every mirrored move safe; checks and captures can change the position.',
 'Bring your second knight toward the centre.', 'Nc3 develops the b1 knight and protects e4. Black can complete the four-knight setup with ...Nf6.');
lesson('kings-gambit',"King's Gambit",'Open games',"King's Gambit",'e4 e5 f4 exf4 Nf3',4,
 'White offers the f-pawn to challenge e5 and accelerate activity.',
 'Develop quickly and handle king safety while trying to recover the pawn or use the open lines.',
 'Consolidate with development; decide whether holding the extra pawn is worth the time.',
 'The opened king diagonal makes careless attacking moves costly.',
 'Develop the kingside knight and control h4 after Black accepts the pawn.', 'Nf3 develops and controls h4, making a direct ...Qh4+ unavailable. White still needs rapid development to justify the pawn offer.');
lesson('bishops',"Bishop's Opening",'Open games',"Bishop's Opening",'e4 e5 Bc4 Nf6 d3',4,
 'White develops the bishop early, leaving the kingside knight flexible.',
 'Support e4, develop the knights, and choose the moment for central expansion.',
 'Attack the centre with development and prepare ...d5 when possible.',
 'Pressure on f7 is a theme, not a licence to sacrifice without calculation.',
 'Support e4 with a pawn and open a path for the other bishop.', 'd3 protects e4 and opens the c1 bishop diagonal. White can continue developing behind a stable centre.');
lesson('sicilian','Sicilian Defence','Replies to 1.e4','Sicilian Defense','e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3',4,
 'Black contests the centre with the c-pawn, creating an asymmetric structure.',
 'In the Open Sicilian, use the central knight and development lead to create activity.',
 'Develop around the chosen pawn structure and use central breaks and the half-open c-file.',
 'Najdorf, Dragon, Closed and Alapin positions need different plans; learn a branch before memorising deep lines.',
 'Open the centre in this Open Sicilian line.', 'd4 invites ...cxd4 and Nxd4. White trades the d-pawn for Black\'s c-pawn and develops an active central knight.');
lesson('french','French Defence','Replies to 1.e4','French Defense','e4 e6 d4 d5 e5 c5 c3 Nc6',5,
 'A supported ...d5 challenges White; in the Advance structure the pawn chains define the plans.',
 'Support the d4 base, develop, and use the extra space without neglecting the king.',
 'Attack d4 with ...c5 and pieces; look for a useful role for the light bishop.',
 'Pushing more pawns does not repair an undefended base on d4.',
 'Challenge the base of White\'s pawn chain.', 'c5 attacks d4, the support for e5. After c3, ...Nc6 adds another attacker to the same target.');
lesson('caro','Caro-Kann Defence','Replies to 1.e4','Caro-Kann Defense','e4 c6 d4 d5 e5 Bf5 c3 e6 Be2',5,
 'Black prepares ...d5 while leaving the light bishop a route outside the pawn chain.',
 'Use the space advantage, finish development, and watch Black\'s central breaks.',
 'Develop the light bishop before ...e6 in this Advance setup, then challenge the centre.',
 'The bishop move order matters: ...e6 first closes the route from c8 to f5.',
 'Develop the light bishop before closing its diagonal.', 'Bf5 brings the c8 bishop outside the pawn chain. Black can then play ...e6 without trapping it behind the pawns.');
lesson('scandinavian','Scandinavian Defence','Replies to 1.e4','Scandinavian Defense','e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6',4,
 'Black challenges e4 immediately; a queen recapture gives White a developing target.',
 'Develop with tempo against the queen, take central space, and complete development.',
 'Move the queen to a useful safe square and develop efficiently around the centre.',
 'Chasing the queen repeatedly can waste the time gained by the first developing attack.',
 'Develop a knight while attacking the queen.', 'Nc3 develops and attacks Qd5. Once the queen moves, White can use d4 to occupy the centre.');
lesson('pirc','Pirc Defence','Replies to 1.e4','Pirc Defense','e4 d6 d4 Nf6 Nc3 g6 Nf3 Bg7',7,
 'Black allows a broad white centre and prepares to challenge it with pieces and pawn breaks.',
 'Develop behind the centre and choose a setup that keeps the king safe.',
 'Fianchetto, castle, and choose an appropriate ...c5 or ...e5 challenge.',
 'Having space is useful only if the centre can withstand counterattack.',
 'Complete the kingside fianchetto.', 'Bg7 develops the bishop onto the long diagonal. Black is preparing to castle and contest the centre.');
lesson('modern','Modern Defence','Replies to 1.e4','Modern Defense','e4 g6 d4 Bg7 Nc3 d6',3,
 'Black fianchettoes before committing the g8 knight, preserving move-order choices.',
 'Occupy the centre, develop naturally, and watch for attacks on the pawn chain.',
 'Use the long diagonal and choose central breaks according to White\'s setup.',
 'Delaying development too long gives White time to consolidate the space advantage.',
 'Use the square prepared by ...g6 to develop the bishop.', 'Bg7 completes the fianchetto. The bishop will exert more influence when central pawns move or are exchanged.');
lesson('alekhine',"Alekhine's Defence",'Replies to 1.e4','Alekhine Defense','e4 Nf6 e5 Nd5 d4 d6',5,
 'Black invites pawn advances and then attacks the extended centre.',
 'Gain space while developing enough pieces to support the pawns.',
 'Keep the knight safe and undermine the advanced pawns with timely central breaks.',
 'Chasing the knight with every pawn can create targets and leave pieces undeveloped.',
 'Challenge the advanced e5 pawn with the d-pawn.', 'd6 attacks e5, beginning the counterattack against White\'s advanced centre. Black must keep developing as the tension changes.');
lesson('qgd',"Queen's Gambit Declined",'Queen-pawn openings',"Queen's Gambit Declined",'d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7',3,
 'Black reinforces d5 with ...e6 and builds a solid central structure.',
 'Develop with pressure on d5 and choose when to exchange the c-pawn.',
 'Develop, secure the king, and prepare a freeing ...c5 or suitable central exchange.',
 'The light bishop needs a development plan because the e6 pawn blocks its diagonal.',
 'Support d5 with the e-pawn.', 'e6 reinforces d5 and opens the f8 bishop diagonal. The c8 bishop is restricted, a trade-off Black must address later.');
lesson('qga',"Queen's Gambit Accepted",'Queen-pawn openings',"Queen's Gambit Accepted",'d4 d5 c4 dxc4 Nf3 Nf6 e3',6,
 'Black takes the c4 pawn and relies on activity to challenge White\'s centre.',
 'Develop and recover c4 under favourable conditions, often using the f1 bishop.',
 'Develop quickly and challenge the centre rather than spending many moves defending c4.',
 'Trying to keep the extra pawn at any cost can expose the queenside and delay development.',
 'Open a route for the bishop to recover c4.', 'e3 supports d4 and opens the f1 bishop diagonal toward c4. White prepares to recover the pawn through development.');
lesson('slav','Slav Defence','Queen-pawn openings','Slav Defense','d4 d5 c4 c6 Nf3 Nf6 Nc3',3,
 'Black supports d5 with the c-pawn, leaving the light bishop diagonal available.',
 'Develop and maintain central pressure while watching Black\'s choices about ...dxc4.',
 'Develop the pieces and choose when the light bishop can leave the pawn chain safely.',
 'A bishop move can leave b7 or d5 vulnerable; opening the diagonal is only the first step.',
 'Support d5 without moving the e-pawn.', 'c6 reinforces d5 while keeping c8-h3 open. This gives Black a different bishop-development problem from the Queen\'s Gambit Declined.');
lesson('semi-slav','Semi-Slav Defence','Queen-pawn openings','Semi-Slav Defense','d4 d5 c4 c6 Nf3 Nf6 Nc3 e6',7,
 'Black combines the ...c6 and ...e6 supports for d5, creating a strong but compact centre.',
 'Develop the bishops and decide whether to keep central tension or resolve it.',
 'Complete development and prepare a freeing ...c5 or ...e5 break.',
 'A solid pawn triangle can become passive if the pieces never find active squares.',
 'Add the e-pawn support to d5 in this Semi-Slav structure.', 'e6 supports d5 and frees the f8 bishop. Black accepts a restricted light bishop while building a resilient centre.');
lesson('london','London System','Queen-pawn openings','London System','d4 Nf6 Nf3 g6 Bf4 Bg7 e3 d6 Bd3',4,
 'White develops the dark bishop before building an e3-based pawn chain.',
 'Support the centre, develop, castle, and prepare e4 when the position permits.',
 'Contest the centre with ...c5 or ...e5 and challenge White\'s comfortable setup.',
 'A familiar setup still requires checking threats; opponent moves can change the right move order.',
 'Develop the dark bishop outside the future e3 pawn chain.', 'Bf4 places the bishop actively before e3 blocks its diagonal from c1. White can then support the centre and develop the other bishop.');
lesson('colle','Colle System','Queen-pawn openings',"Queen's Pawn Game",'d4 d5 Nf3 Nf6 e3 e6 Bd3',6,
 'White develops behind a d4/e3 centre and prepares an eventual e4 break.',
 'Coordinate the pieces, castle, and support e4 before opening the centre.',
 'Challenge d4 with ...c5 and develop actively before White achieves the central break.',
 'The c1 bishop can remain cramped; the system needs a plan to open the position.',
 'Develop the light bishop to support the e4 break.', 'Bd3 develops and controls e4. White should coordinate the remaining pieces before pushing the e-pawn.');
lesson('catalan','Catalan Opening','Queen-pawn openings','Catalan Opening','d4 Nf6 c4 e6 g3 d5 Bg2',6,
 'White combines the queen-pawn centre with a bishop on the long diagonal.',
 'Develop, castle, and use the g2 bishop to pressure the centre and queenside.',
 'Choose whether to hold d5 or take c4, while completing development and managing the long diagonal.',
 'Recovering a pawn should be balanced against development and the bishop\'s activity.',
 'Place the bishop on the diagonal prepared by g3.', 'Bg2 completes the fianchetto and points toward the central d5 square. Its pressure grows as the centre opens.');
lesson('nimzo','Nimzo-Indian Defence','Indian defences','Nimzo-Indian Defense','d4 Nf6 c4 e6 Nc3 Bb4 e3',5,
 'Black pins the c3 knight and contests e4 with pieces.',
 'Develop and decide how to handle the pin, possible doubled pawns, and the bishop pair.',
 'Use the pin and central pressure; exchange on c3 only when it serves the position.',
 'The bishop pair and pawn structure are trade-offs, not automatic advantages in every position.',
 'Pin the c3 knight to restrict its influence on e4.', 'Bb4 pins Nc3 to the king and helps Black control e4. Black may later exchange bishop for knight or keep the tension.');
lesson('queens-indian',"Queen's Indian Defence",'Indian defences',"Queen's Indian Defense",'d4 Nf6 c4 e6 Nf3 b6 g3 Bb7',7,
 'Black develops the light bishop on the long diagonal to influence central squares.',
 'Develop and look for chances to expand with d5 or e4 under favourable conditions.',
 'Use the bishop and knights to restrain the centre, then prepare an appropriate pawn break.',
 'A long diagonal can be blocked by your own pieces; coordinate them to keep the bishop useful.',
 'Complete the queenside fianchetto.', 'Bb7 develops the light bishop toward e4. The bishop and f6 knight can cooperate to contest central space.');
lesson('bogo','Bogo-Indian Defence','Indian defences','Bogo-Indian Defense','d4 Nf6 c4 e6 Nf3 Bb4+ Bd2',6,
 'Black develops with check before White commits the queenside knight.',
 'Meet the check with development and continue building a coordinated centre.',
 'Decide whether to exchange the bishop or retreat it while keeping development efficient.',
 'A check is useful only if the resulting position supports your plan.',
 'Block the check with a developing bishop move.', 'Bd2 interposes the c1 bishop and challenges Bb4. White develops while meeting the immediate threat.');
lesson('kings-indian',"King's Indian Defence",'Indian defences',"King's Indian Defense",'d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O',7,
 'Black allows White a broad centre and prepares counterplay against it.',
 'Develop behind the space advantage and respond to Black\'s central breaks.',
 'Castle, finish development, and choose between ...e5 and ...c5 according to the structure.',
 'A kingside pawn storm belongs to particular closed structures; it is not the plan in every variation.',
 'Control e5 and prepare a central challenge.', 'd6 restrains e5 and prepares a later ...e5 break. Black should coordinate development and king safety before committing to an attack.');
lesson('grunfeld','Grünfeld Defence','Indian defences','Grünfeld Defense','d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3',5,
 'Black challenges the centre immediately and may allow a large white pawn centre as a target.',
 'Support the central pawns with pieces and use the space to develop actively.',
 'Attack the centre with the g7 bishop, pawn breaks, and coordinated pieces.',
 'A large pawn centre can be strong or vulnerable depending on piece support.',
 'Challenge d4 immediately with a central pawn.', 'd5 contests the centre. In the Exchange line that follows, White gains a broad pawn centre that Black will try to undermine.');
lesson('benoni','Modern Benoni','Indian defences','Benoni Defense','d4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6',5,
 'The asymmetric pawn structure gives White central space and Black queenside counterplay.',
 'Support the d5 pawn, develop, and prepare e4-e5 when it can be sustained.',
 'Develop actively and seek counterplay, often using a queenside pawn break.',
 'Black\'s cramped position needs activity; White should not allow counterplay without checking it.',
 'Challenge the advanced d5 pawn with the e-pawn.', 'e6 puts pressure on d5. After exchanges, the remaining white d5 pawn gives space while Black seeks activity around it.');
lesson('benko','Benko Gambit','Indian defences','Benko Gambit','d4 Nf6 c4 c5 d5 b5 cxb5 a6',5,
 'Black offers a queenside pawn to open files and gain sustained piece activity.',
 'Balance the extra pawn against development and queenside pressure; returning material can be a useful option.',
 'Develop the bishop and rooks toward the opened queenside files.',
 'This pawn offer seeks lasting pressure; it does not promise an immediate tactical win.',
 'Offer the b-pawn to start opening the queenside.', 'b5 challenges c4 and offers a pawn. After cxb5, ...a6 continues the plan of opening lines for the black pieces.');
lesson('dutch','Dutch Defence','Other systems','Dutch Defense','d4 f5 g3 Nf6 Bg2 g6',1,
 'Black controls e4 with the f-pawn and accepts changes to king safety.',
 'Develop and challenge Black\'s centre while watching the squares weakened by ...f5.',
 'Build a coordinated setup and secure the king before using the kingside space.',
 'The f-pawn move opens lines around the king; do not neglect development.',
 'Use the f-pawn to contest e4 in the Dutch.', 'f5 controls e4 and gains kingside space. It also changes king safety, so Black must develop carefully.');
lesson('english','English Opening','Other systems','English Opening','c4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7',4,
 'White controls central squares from the flank and keeps the central pawns flexible.',
 'Develop the fianchetto and choose a central break based on Black\'s structure.',
 'Contest central squares and avoid copying moves when the position calls for a concrete response.',
 'The English reaches many structures; plans depend on whether Black uses ...e5, ...c5, or another setup.',
 'Prepare the bishop for the long diagonal.', 'g3 prepares Bg2 while leaving the d- and e-pawns flexible. This is a common development plan in the Symmetrical English.');
lesson('reti','Réti Opening','Other systems','Réti Opening','Nf3 d5 c4',2,
 'White develops first and then challenges the centre from the side.',
 'Pressure d5, develop flexibly, and decide when to occupy the centre with pawns.',
 'Use the available space, develop, and support the centre against flank pressure.',
 'Move orders can transpose into other openings; recognise the structure rather than relying only on the name.',
 'Challenge the d5 pawn with your c-pawn.', 'c4 attacks d5 from the flank. White can then decide how to develop and whether to enter a queen-pawn structure.');
lesson('trompowsky','Trompowsky Attack','Other systems','Trompowsky Attack','d4 Nf6 Bg5 e6 e4',2,
 'White develops the dark bishop early and challenges the f6 knight.',
 'Use flexible development and decide whether exchanging on f6 helps your central plan.',
 'Meet the bishop actively while maintaining development and central control.',
 'A trade on f6 changes the pawn structure but also gives up a bishop; assess both consequences.',
 'Develop the dark bishop to challenge Nf6.', 'Bg5 attacks the knight before White commits the c-pawn. It introduces the choice of exchanging on f6 or retaining the bishop.');
if(lessons.length!==34)throw Error('Expected 34 lessons, found '+lessons.length);
fs.writeFileSync(path.join(__dirname,'main-families.json'),JSON.stringify(lessons,null,2)+'\n');
console.log('Authored '+lessons.length+' lessons; every line matches a catalogue prefix.');
